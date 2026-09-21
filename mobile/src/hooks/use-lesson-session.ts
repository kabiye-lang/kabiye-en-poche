import type { LessonStep } from '../types/lesson-steps'
import type { Effect, LessonSession, ProgressView } from '../utils/lesson-session'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  decode,
  fingerprintLesson,
  initialSession,
  advance as pureAdvance,
  answer as pureAnswer,
  progressView as pureProgressView,
  showWord as pureShowWord,
} from '../utils/lesson-session'

const sessionKey = (lessonId: string) => `lesson-session:v1:${lessonId}`

// A storage failure costs the learner a resume point, not the lesson itself -- the app
// keeps working in memory. Logged once per app run rather than once per failure, which on
// a flaky device would otherwise fill the log with the same line.
let warnedOnce = false
function warnStorageError(context: string, err: unknown) {
  if (warnedOnce) return
  warnedOnce = true
  console.warn(`[use-lesson-session] ${context}`, err)
}

/**
 * One write chain per storage key, latest revision wins.
 *
 * Every `persist` call takes the next global revision number and records it as the latest
 * for its key before it ever reaches the front of that key's chain. When a queued write's
 * turn comes, it checks whether it is still the latest for its key; if a later write has
 * since been queued, this one is a no-op -- only the newest session for a given lesson is
 * ever actually written to disk, in the order writes were requested.
 */
const latestRevisionByKey = new Map<string, number>()
const chainByKey = new Map<string, Promise<void>>()
let nextRevision = 0

function scheduleWrite(key: string, write: () => Promise<void>): Promise<void> {
  const revision = ++nextRevision
  latestRevisionByKey.set(key, revision)

  const previous = chainByKey.get(key) ?? Promise.resolve()
  const run = async () => {
    if (latestRevisionByKey.get(key) !== revision) return // superseded before its turn
    await write()
  }
  const next = previous.then(run, run)
  // The chain must keep moving even if a write throws.
  chainByKey.set(
    key,
    next.then(
      () => undefined,
      () => undefined
    )
  )
  return next
}

export interface UseLessonSessionResult {
  session: LessonSession | null
  isHydrated: boolean
  progressView: ProgressView | null
  advance: () => Effect[]
  answer: (step: LessonStep, givenAnswer: string, isCorrect: boolean) => Effect[]
  showWord: () => void
  /** Await the pending write (max 300ms) before navigating away. A hard kill mid-write --
   *  the process dying while the native `setItem` call is in flight -- is not guaranteed
   *  to land either way; this only protects the ordinary "user taps close" path. */
  flush: () => Promise<void>
  /** Remove the stored session. Never throws -- a removal failure is logged and otherwise
   *  ignored, so the caller (lesson completion) can always navigate on afterwards. */
  clear: () => Promise<void>
}

/**
 * Loads, holds and persists a lesson's `LessonSession`.
 *
 * `lessonSteps` is the fixed lesson -- cover through the last taught/practised step,
 * excluding `completion` -- exactly what `utils/lesson-session.ts`'s pure functions
 * expect. Hydration waits for it to be non-empty (the caller is still loading content
 * otherwise) and runs once; `session` stays `null` until it resolves, so the screen can
 * keep showing its loading skeleton rather than flash a step-zero session that is about to
 * be replaced by a restored one.
 */
export function useLessonSession(lessonId: string, lessonSteps: readonly LessonStep[]): UseLessonSessionResult {
  const [session, setSessionState] = useState<LessonSession | null>(null)
  // Actions read this, not the `session` state variable: two actions can fire in the same
  // handler (an answer immediately followed by advancing past it), and `session` from a
  // `useCallback` closure would still be last render's value when the second one runs.
  const sessionRef = useRef<LessonSession | null>(null)
  const hydratedRef = useRef(false)
  const key = sessionKey(lessonId)

  const setSession = useCallback((next: LessonSession) => {
    sessionRef.current = next
    setSessionState(next)
  }, [])

  useEffect(
    function hydrateSession() {
      if (hydratedRef.current || lessonSteps.length === 0) return
      hydratedRef.current = true
      let cancelled = false

      void (async () => {
        const fingerprint = fingerprintLesson(lessonSteps)
        let restored: LessonSession | null = null
        try {
          const raw = await AsyncStorage.getItem(key)
          if (raw) {
            restored = decode(raw, lessonSteps, fingerprint)
            if (!restored) await AsyncStorage.removeItem(key) // corrupt, invalid, or stale content
          }
        } catch (err) {
          warnStorageError('failed to read stored session', err)
        }
        if (cancelled) return
        setSession(restored ?? initialSession(fingerprint))
      })()

      return () => {
        cancelled = true
      }
    },
    [lessonSteps, key, setSession]
  )

  const persist = useCallback(
    (next: LessonSession) => {
      const lessonStepCount = lessonSteps.length
      void scheduleWrite(key, async () => {
        try {
          await AsyncStorage.setItem(key, JSON.stringify({ ...next, lessonStepCount }))
        } catch (err) {
          warnStorageError('failed to write session', err)
        }
      })
    },
    [key, lessonSteps.length]
  )

  const advance = useCallback((): Effect[] => {
    const current = sessionRef.current
    if (!current) return []
    const { state, effects } = pureAdvance(current, lessonSteps)
    setSession(state)
    persist(state)
    return effects
  }, [lessonSteps, persist, setSession])

  const answer = useCallback(
    (step: LessonStep, givenAnswer: string, isCorrect: boolean): Effect[] => {
      const current = sessionRef.current
      if (!current) return []
      const { state, effects } = pureAnswer(current, step, givenAnswer, isCorrect)
      setSession(state)
      persist(state)
      return effects
    },
    [persist, setSession]
  )

  const showWord = useCallback(() => {
    const current = sessionRef.current
    if (!current) return
    const state = pureShowWord(current)
    setSession(state)
    persist(state)
  }, [persist, setSession])

  const flush = useCallback((): Promise<void> => {
    const pending = chainByKey.get(key) ?? Promise.resolve()
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 300))
    return Promise.race([pending, timeout])
  }, [key])

  const clear = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key)
    } catch (err) {
      warnStorageError('failed to remove session', err)
    }
  }, [key])

  useEffect(
    function flushOnBackground() {
      const subscription = AppState.addEventListener('change', (next) => {
        if (next === 'background' || next === 'inactive') void flush()
      })
      return () => subscription.remove()
    },
    [flush]
  )

  return {
    session,
    isHydrated: session !== null,
    progressView: session ? pureProgressView(session, lessonSteps) : null,
    advance,
    answer,
    showWord,
    flush,
    clear,
  }
}

/**
 * A non-throwing, lightweight read for Home (see spec 4): whether a lesson has a session
 * worth resuming, and how far along it is. It cannot recompute a fingerprint -- Home does
 * not have the lesson's steps loaded -- so it validates structurally instead, against the
 * `lessonStepCount` the session was saved with rather than the live content. A session
 * whose content has since changed still shows a stale "3 of 8" here; opening the lesson
 * itself re-validates against the real fingerprint and discards it there if it no longer
 * matches.
 */
export async function readLessonSessionSummary(
  lessonId: string
): Promise<{ kind: 'lesson'; current: number; total: number } | { kind: 'review' } | null> {
  try {
    const raw = await AsyncStorage.getItem(sessionKey(lessonId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    const { phase, lessonIndex, reviewStepIds, reviewIndex, lessonStepCount } = parsed as Record<string, unknown>

    if (phase !== 'lesson' && phase !== 'review' && phase !== 'finish') return null
    if (phase === 'finish') return null // nothing left to resume

    if (typeof lessonStepCount !== 'number' || !Number.isInteger(lessonStepCount) || lessonStepCount <= 0) return null
    if (typeof lessonIndex !== 'number' || !Number.isInteger(lessonIndex)) return null
    if (lessonIndex < 0 || lessonIndex >= lessonStepCount) return null

    if (!Array.isArray(reviewStepIds) || !reviewStepIds.every((id) => typeof id === 'string')) return null
    if (typeof reviewIndex !== 'number' || !Number.isInteger(reviewIndex)) return null
    if (reviewIndex < 0 || reviewIndex > reviewStepIds.length) return null
    if (phase === 'review' && reviewStepIds.length === 0) return null
    if (phase === 'review' && reviewIndex >= reviewStepIds.length) return null

    if (phase === 'review') return { kind: 'review' }
    return { kind: 'lesson', current: lessonIndex + 1, total: lessonStepCount }
  } catch {
    return null
  }
}
