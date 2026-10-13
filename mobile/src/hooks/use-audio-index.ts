import type { LessonExample } from '../types/lesson-steps'
import type { AudioIndex, AudioRecord } from '../utils/find-audio'

import { useCallback, useEffect, useState } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { DEV_AUDIO_FIXTURE_URI } from '../utils/dev-audio-fixture'
import { EMPTY_AUDIO_INDEX, exampleAudioUrl } from '../utils/find-audio'
import { audioSnapshotKey, sessionKey } from './use-lesson-session'

/** PostgREST returns at most 1,000 rows per request; the word list alone is ~1,100. */
const PAGE_SIZE = 1000

const FIXTURE_INDEX: AudioIndex | undefined = DEV_AUDIO_FIXTURE_URI
  ? { records: [], fixtureUrl: DEV_AUDIO_FIXTURE_URI }
  : undefined

async function fetchAudioIndex(): Promise<AudioIndex> {
  const records: AudioRecord[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    // Only approved native recordings; RLS hides the rest from the app anyway.
    const { data, error } = await supabase
      .from('audios')
      .select('storage_path, kind, kbp_key, lexeme_id')
      .eq('status', 'approved')
      .eq('source', 'native')
      .order('storage_path')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    for (const row of data ?? []) {
      records.push({
        url: supabase.storage.from('audios').getPublicUrl(row.storage_path).data.publicUrl,
        kind: row.kind,
        kbpKey: row.kbp_key,
        lexemeId: row.lexeme_id,
      })
    }
    if (!data || data.length < PAGE_SIZE) return { records }
  }
}

/**
 * Every recording the app may play, loaded once and looked up with `findAudio`.
 *
 * A failed load is "no recordings", silently: the lesson and the dictionary work without
 * audio, and an error banner about a feature the learner never asked for helps nobody.
 * `isSettled` is true once the load has succeeded or failed -- the lesson waits for it
 * because its step list (and so its saved-session fingerprint) depends on the index.
 *
 * Failures are retried with the app's defaults: a new lesson session started on one
 * transient failure would otherwise be audio-less for its whole length (see
 * `useLessonAudio`).
 */
export function useAudioIndex(): { index: AudioIndex; isSettled: boolean } {
  const query = useQuery({
    queryKey: ['audios', 'playable'],
    queryFn: fetchAudioIndex,
    enabled: FIXTURE_INDEX === undefined,
    staleTime: 1000 * 60 * 60 * 6,
  })

  if (FIXTURE_INDEX) return { index: FIXTURE_INDEX, isSettled: true }
  return {
    index: query.data ?? EMPTY_AUDIO_INDEX,
    isSettled: !query.isPending,
  }
}

/** Taught word -> its recording, for the words that had one. */
type AudioSnapshot = Record<string, string>

const snapshotWordKey = (word: LessonExample) => `${word.lexeme_id ?? ''}|${word.kbp}`

function parseSnapshot(raw: string | null): AudioSnapshot | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    if (!Object.values(parsed).every((url) => typeof url === 'string')) return null
    return parsed as AudioSnapshot
  } catch {
    return null
  }
}

/** The stored snapshot, but only when there is a saved session for it to belong to. */
async function readResumableSnapshot(lessonId: string): Promise<AudioSnapshot | null> {
  try {
    const [session, snapshot] = await Promise.all([
      AsyncStorage.getItem(sessionKey(lessonId)),
      AsyncStorage.getItem(audioSnapshotKey(lessonId)),
    ])
    return session ? parseSnapshot(snapshot) : null
  } catch (err) {
    console.warn('[use-lesson-audio] failed to read the audio snapshot', err)
    return null
  }
}

/**
 * The recordings a lesson session plays, fixed for the whole session -- across leaving
 * the lesson and coming back, not just while the screen is up.
 *
 * A lesson's steps depend on its recordings (a recorded word gains a listening question),
 * and the saved session is tied to those steps by fingerprint. Recordings are approved
 * while learners are mid-lesson, so a session resumed against the live index would no
 * longer match its steps and be thrown away. Instead the first settled live index seeds a
 * snapshot -- each taught word's recording -- which is stored next to the session and
 * read back on resume; the live index is not consulted again until there is no saved
 * session to resume. Within one visit the snapshot also holds still when a later fetch
 * recovers from a failed one (another screen's observer retries the query).
 *
 * `isSettled` waits for the storage read, so the lesson never builds its steps -- and
 * hydrates its session -- from the live index when a snapshot is about to arrive.
 *
 * Trade-off: if the lesson's content changes and its saved session is discarded, the next
 * session still uses the old snapshot, until the lesson is completed and `clear` runs.
 */
export function useLessonAudio(
  lessonId: string,
  words: readonly LessonExample[],
  wordsReady: boolean
): {
  audioFor: (word: LessonExample) => string | undefined
  isSettled: boolean
  clear: () => Promise<void>
} {
  const live = useAudioIndex()
  const [stored, setStored] = useState<{ lessonId: string; snapshot: AudioSnapshot | null } | undefined>(undefined)
  const [frozen, setFrozen] = useState<{ lessonId: string; snapshot: AudioSnapshot; seeded: boolean } | undefined>(
    undefined
  )

  useEffect(
    function readStoredSnapshot() {
      let cancelled = false
      void readResumableSnapshot(lessonId).then((snapshot) => {
        if (!cancelled) setStored({ lessonId, snapshot })
      })
      return () => {
        cancelled = true
      }
    },
    [lessonId]
  )

  // Render-time state adjustment: fix the snapshot once per lesson. A stored one wins; a
  // new session is seeded from the live index, the failed-load fallback included.
  if (frozen?.lessonId !== lessonId && stored?.lessonId === lessonId) {
    if (stored.snapshot) {
      setFrozen({ lessonId, snapshot: stored.snapshot, seeded: false })
    } else if (live.isSettled && wordsReady) {
      const seed: AudioSnapshot = {}
      for (const word of words) {
        const url = exampleAudioUrl(live.index, word)
        if (url) seed[snapshotWordKey(word)] = url
      }
      setFrozen({ lessonId, snapshot: seed, seeded: true })
    }
  }

  useEffect(
    function storeSeededSnapshot() {
      if (!frozen?.seeded) return
      AsyncStorage.setItem(audioSnapshotKey(frozen.lessonId), JSON.stringify(frozen.snapshot)).catch((err: unknown) =>
        console.warn('[use-lesson-audio] failed to write the audio snapshot', err)
      )
    },
    [frozen]
  )

  const snapshot = frozen?.lessonId === lessonId ? frozen.snapshot : undefined
  const audioFor = useCallback(
    (word: LessonExample) => (snapshot ? snapshot[snapshotWordKey(word)] : undefined),
    [snapshot]
  )

  const clear = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(audioSnapshotKey(lessonId))
    } catch (err) {
      console.warn('[use-lesson-audio] failed to remove the audio snapshot', err)
    }
  }, [lessonId])

  return { audioFor, isSettled: snapshot !== undefined, clear }
}
