import type { AudioIndex, AudioRecord } from '../utils/find-audio'

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { DEV_AUDIO_FIXTURE_URI } from '../utils/dev-audio-fixture'
import { EMPTY_AUDIO_INDEX } from '../utils/find-audio'

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
 */
export function useAudioIndex(): { index: AudioIndex; isSettled: boolean } {
  const query = useQuery({
    queryKey: ['audios', 'playable'],
    queryFn: fetchAudioIndex,
    enabled: FIXTURE_INDEX === undefined,
    staleTime: 1000 * 60 * 60 * 6,
    retry: false,
  })

  if (FIXTURE_INDEX) return { index: FIXTURE_INDEX, isSettled: true }
  return {
    index: query.data ?? EMPTY_AUDIO_INDEX,
    isSettled: !query.isPending,
  }
}
