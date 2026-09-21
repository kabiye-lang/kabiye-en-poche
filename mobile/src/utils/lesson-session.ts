import type { ActivityStep, LessonStep } from '../types/lesson-steps'

import { isInteractive } from './lesson-outcomes'

/**
 * The lesson's own state machine: what step the learner is on, what came back for review,
 * and what was answered where. Pure -- no storage, no React -- so it can be tested by
 * feeding it sequences of answers and checking where it ends up. `mobile/src/hooks/
 * use-lesson-session.ts` is the only thing that persists it.
 *
 * `steps` everywhere in this module means the *fixed* lesson: cover through the last
 * taught/practised step, in order, excluding the trailing `completion` step -- `finish` is
 * a `phase`, not a step index. Callers pass `steps.slice(0, -1)` of the array
 * `screens/lesson.tsx` builds.
 */

export type Phase = 'lesson' | 'review' | 'finish'

export interface LessonSessionAnswer {
  answer: string
  isCorrect: boolean
  /** Recorded after "Show the word again" was opened for this id -- see `showWord`. A
   *  supported right answer is `helped`, never counted as independent success. */
  supported: boolean
}

export interface LessonSession {
  v: 1
  /** See `fingerprintLesson`. A mismatch means the lesson content changed since this was
   *  saved -- `decode` throws the session away rather than replay it against a different
   *  lesson. */
  fingerprint: string
  phase: Phase
  /** Index into the fixed lesson steps. Stays at the last index once `phase` leaves
   *  `'lesson'` -- irrelevant then, but kept in range so `decode`'s invariant holds. */
  lessonIndex: number
  /** Frozen the moment review starts: ids of the *original* lesson steps that were missed,
   *  in lesson order. Never mutated afterwards, however the review walk fares. */
  reviewStepIds: string[]
  reviewIndex: number
  /** Keyed by step id in lesson phase, `retry-{id}` in review -- the retry step object
   *  `lesson.tsx` renders carries that id already, so `answer` never branches on phase. */
  answers: Record<string, LessonSessionAnswer>
  /** Retry ids (`retry-{id}`) where "Show the word again" was opened. */
  shown: string[]
}

export type Effect = { kind: 'markWritten'; headword: string } | { kind: 'addMet' } | { kind: 'announceReview' }

export interface TransitionResult {
  state: LessonSession
  effects: Effect[]
}

export interface ProgressViewLesson {
  kind: 'lesson'
  current: number
  total: number
}
export interface ProgressViewReview {
  kind: 'review'
  current: number
  total: number
  isStart: boolean
}
export interface ProgressViewFinish {
  kind: 'finish'
  total: number
}
export type ProgressView = ProgressViewLesson | ProgressViewReview | ProgressViewFinish

export type ReviewOutcome = 'right' | 'helped' | 'missed'

/** A fresh session for a lesson that has never been opened, or whose stored one was
 *  discarded. Always starts on the first lesson step. */
export function initialSession(fingerprint: string): LessonSession {
  return {
    v: 1,
    fingerprint,
    phase: 'lesson',
    lessonIndex: 0,
    reviewStepIds: [],
    reviewIndex: 0,
    answers: {},
    shown: [],
  }
}

/**
 * A small stable hash (djb2) of the lesson's shape -- ids, order, and the activity data an
 * answer is checked against. Anything that would make a stored `lessonIndex` or
 * `reviewStepIds` point at the wrong question invalidates the session; wording-only edits
 * to prose that carries no activity do not.
 */
export function fingerprintLesson(steps: readonly LessonStep[]): string {
  const payload = JSON.stringify(
    steps.map((s) => [
      s.id,
      s.type,
      'activity' in s ? ((s as ActivityStep).activity?.data ?? null) : null,
      s.type === 'teach' ? s.example.kbp : null,
    ])
  )
  let hash = 5381
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33 + payload.charCodeAt(i)) >>> 0
  }
  return hash.toString(36)
}

/**
 * Advance one step: within a phase, or across a phase boundary when the walk runs out.
 *
 * Lesson phase falling off the end decides, once, whether there is a review: any
 * interactive step answered wrong in lesson phase (not supported -- nothing is "supported"
 * before review exists) sends the learner into review with that list frozen; otherwise
 * straight to finish. Review phase falling off the end always goes to finish. Finish does
 * not advance further.
 */
export function advance(state: LessonSession, steps: readonly LessonStep[]): TransitionResult {
  if (state.phase === 'lesson') {
    const next = state.lessonIndex + 1
    if (next < steps.length) {
      return { state: { ...state, lessonIndex: next }, effects: [] }
    }

    const reviewStepIds = steps
      .filter(isInteractive)
      .filter((step) => {
        const a = state.answers[step.id]
        return a !== undefined && !a.isCorrect && !a.supported
      })
      .map((step) => step.id)

    if (reviewStepIds.length > 0) {
      return {
        state: { ...state, phase: 'review', reviewStepIds, reviewIndex: 0 },
        effects: [{ kind: 'announceReview' }],
      }
    }
    return { state: { ...state, phase: 'finish' }, effects: [{ kind: 'addMet' }] }
  }

  if (state.phase === 'review') {
    const next = state.reviewIndex + 1
    if (next < state.reviewStepIds.length) {
      return { state: { ...state, reviewIndex: next }, effects: [] }
    }
    return { state: { ...state, phase: 'finish' }, effects: [{ kind: 'addMet' }] }
  }

  // finish: nowhere further to go.
  return { state, effects: [] }
}

/**
 * Record an answer under the current step's own id (already `retry-{id}` in review -- see
 * the `answers` doc comment). Idempotent: a second call for an id already answered is a
 * double tap and changes nothing.
 *
 * `markWritten` fires only for a spelling step, answered right, not supported -- the one
 * piece of evidence the app treats as "this person can write this word". A word shown and
 * then spelled correctly is `helped`, not written.
 */
export function answer(
  state: LessonSession,
  step: LessonStep,
  givenAnswer: string,
  isCorrect: boolean
): TransitionResult {
  const id = step.id
  if (id in state.answers) return { state, effects: [] }

  const supported = state.shown.includes(id)
  const answers = { ...state.answers, [id]: { answer: givenAnswer, isCorrect, supported } }
  const effects: Effect[] = []
  if (step.type === 'spell' && isCorrect && !supported) {
    effects.push({ kind: 'markWritten', headword: givenAnswer.normalize('NFC').trim() })
  }
  return { state: { ...state, answers }, effects }
}

/** Open "Show the word again" for the current review item. Review phase only; a second
 *  call for the same item is a no-op. */
export function showWord(state: LessonSession): LessonSession {
  if (state.phase !== 'review') return state
  const originalId = state.reviewStepIds[state.reviewIndex]
  if (originalId === undefined) return state
  const retryId = `retry-${originalId}`
  if (state.shown.includes(retryId)) return state
  return { ...state, shown: [...state.shown, retryId] }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Parse and validate a stored session against the *current* lesson. Anything off --
 * malformed JSON, a shape that does not match, an invariant violated, or a fingerprint
 * that no longer matches this lesson's content -- returns `null` rather than trying to
 * repair it: the caller starts fresh.
 */
export function decode(json: string, steps: readonly LessonStep[], fingerprint: string): LessonSession | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (!isPlainObject(parsed)) return null
  if (parsed.v !== 1) return null
  if (parsed.fingerprint !== fingerprint) return null
  if (parsed.phase !== 'lesson' && parsed.phase !== 'review' && parsed.phase !== 'finish') return null

  if (typeof parsed.lessonIndex !== 'number' || !Number.isInteger(parsed.lessonIndex)) return null
  if (steps.length === 0 || parsed.lessonIndex < 0 || parsed.lessonIndex >= steps.length) return null

  if (!Array.isArray(parsed.reviewStepIds) || !parsed.reviewStepIds.every((id) => typeof id === 'string')) return null
  const reviewStepIds = parsed.reviewStepIds as string[]
  if (new Set(reviewStepIds).size !== reviewStepIds.length) return null
  const interactiveIds = new Set(steps.filter(isInteractive).map((s) => s.id))
  if (!reviewStepIds.every((id) => interactiveIds.has(id))) return null

  if (typeof parsed.reviewIndex !== 'number' || !Number.isInteger(parsed.reviewIndex)) return null
  if (parsed.reviewIndex < 0 || parsed.reviewIndex > reviewStepIds.length) return null
  if (parsed.phase === 'review' && reviewStepIds.length === 0) return null
  // In review the index must point at an item: `advance` moves to `finish` in the same step
  // that would take it to the end, so `reviewIndex === length` in review is a state the
  // walk never produces -- and one that would render no step at all.
  if (parsed.phase === 'review' && parsed.reviewIndex >= reviewStepIds.length) return null

  if (!isPlainObject(parsed.answers)) return null
  const rawAnswers = parsed.answers
  const knownIds = new Set(steps.map((s) => s.id))
  const retryIds = new Set(reviewStepIds.map((id) => `retry-${id}`))
  for (const [key, value] of Object.entries(rawAnswers)) {
    if (!isPlainObject(value)) return null
    if (
      typeof value.answer !== 'string' ||
      typeof value.isCorrect !== 'boolean' ||
      typeof value.supported !== 'boolean'
    )
      return null
    if (retryIds.has(key)) continue
    if (!knownIds.has(key)) return null
  }

  if (!Array.isArray(parsed.shown) || !parsed.shown.every((id) => typeof id === 'string')) return null
  const shown = parsed.shown as string[]
  if (!shown.every((id) => retryIds.has(id))) return null

  // Every frozen review id must have been answered wrong (not supported -- nothing is
  // supported before review starts) in lesson phase.
  for (const id of reviewStepIds) {
    const a = rawAnswers[id] as { isCorrect: boolean; supported: boolean } | undefined
    if (!a || a.isCorrect) return null
  }

  return {
    v: 1,
    fingerprint,
    phase: parsed.phase,
    lessonIndex: parsed.lessonIndex,
    reviewStepIds,
    reviewIndex: parsed.reviewIndex,
    answers: rawAnswers as LessonSession['answers'],
    shown,
  }
}

/** What the progress bar draws: which track, how far along it, and (review) whether this
 *  is the first item -- `lesson.tsx` shows the "Review" eyebrow only then. `total` for
 *  lesson never grows past the fixed step count, whatever review adds. */
export function progressView(state: LessonSession, steps: readonly LessonStep[]): ProgressView {
  if (state.phase === 'lesson') {
    return { kind: 'lesson', current: state.lessonIndex + 1, total: steps.length }
  }
  if (state.phase === 'review') {
    return {
      kind: 'review',
      current: state.reviewIndex + 1,
      total: state.reviewStepIds.length,
      isStart: state.reviewIndex === 0,
    }
  }
  return { kind: 'finish', total: steps.length }
}

/**
 * One outcome per distinct word that came back in review, in the order review first asks
 * about it. A word can be claimed by more than one review item only in unusual content;
 * the worst outcome wins (missed beats helped beats right), because Finish's claim has to
 * hold for every question that word was asked. Review items with no `wordKbp` (nothing
 * claimed them when the lesson was built) are still asked, but say nothing here -- Finish
 * cannot name a word it does not have.
 */
export function reviewOutcomes(
  state: LessonSession,
  steps: readonly LessonStep[]
): { word: string; outcome: ReviewOutcome }[] {
  const byId = new Map(steps.map((s) => [s.id, s]))
  const rank: Record<ReviewOutcome, number> = { right: 0, helped: 1, missed: 2 }

  const order: string[] = []
  const worst = new Map<string, ReviewOutcome>()

  for (const id of state.reviewStepIds) {
    const step = byId.get(id)
    const word = step && 'wordKbp' in step ? step.wordKbp : undefined
    if (!word) continue

    const a = state.answers[`retry-${id}`]
    const outcome: ReviewOutcome = !a || !a.isCorrect ? 'missed' : a.supported ? 'helped' : 'right'

    if (!worst.has(word)) order.push(word)
    const prev = worst.get(word)
    if (prev === undefined || rank[outcome] > rank[prev]) worst.set(word, outcome)
  }

  return order.map((word) => ({ word, outcome: worst.get(word)! }))
}
