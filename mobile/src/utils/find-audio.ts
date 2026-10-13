import type { LessonExample } from '../types/lesson-steps'

import { usableAudioUrl } from './audio-source'
import { kbpKey } from './kbp-key'

/** One playable recording from the `audios` table, with its public URL already built. */
export interface AudioRecord {
  url: string
  /** 'word' | 'sentence'. A row with no kind (filed before the column existed) is never played. */
  kind: string | null
  kbpKey: string | null
  lexemeId: string | null
}

export interface AudioIndex {
  records: readonly AudioRecord[]
  /** Development only: when set, every lookup returns it. See `dev-audio-fixture.ts`. */
  fixtureUrl?: string
}

export const EMPTY_AUDIO_INDEX: AudioIndex = { records: [] }

/**
 * The recording of one Kabiyè word or sentence, or undefined when we have none we can trust.
 *
 * Word lookups (the default) consider only rows with `kind = 'word'`:
 *
 * 1. A recording filed under the word's exact `lexemeId` wins.
 * 2. Otherwise a recording whose `kbp_key` matches the word's spelling, skipping any that
 *    is filed under a different lexeme. If what is left belongs to more than one lexeme,
 *    there is no answer: Kabiyè does not write tone, so `keɖe#1` and `keɖe#2` are spelled
 *    alike and may be said differently. Silence beats teaching the wrong word.
 *
 * Sentence lookups consider only `kind = 'sentence'` rows, by `kbp_key` alone. A sentence
 * row carries the lexeme id of the word it illustrates, so matching it by lexeme id would
 * play a sentence for a word. A row with no kind is never played.
 */
export function findAudio(
  index: AudioIndex,
  { lexemeId, kbp, kind = 'word' }: { lexemeId?: string | null; kbp: string; kind?: 'word' | 'sentence' }
): string | undefined {
  if (index.fixtureUrl) return index.fixtureUrl

  const records = index.records.filter((record) => record.kind === kind)
  const key = kbpKey(kbp)

  if (kind === 'sentence') {
    return key ? records.find((record) => record.kbpKey === key)?.url : undefined
  }

  if (lexemeId) {
    const exact = records.find((record) => record.lexemeId === lexemeId)
    if (exact) return exact.url
  }

  if (!key) return undefined
  const candidates = records.filter(
    (record) => record.kbpKey === key && !(lexemeId && record.lexemeId && record.lexemeId !== lexemeId)
  )
  const lexemes = new Set(candidates.map((record) => record.lexemeId).filter((id) => id !== null))
  if (lexemes.size > 1) return undefined
  return candidates[0]?.url
}

/**
 * The URL to play for a lesson word, gated by `usableAudioUrl`. A legacy `audio_url` on
 * the example still wins when it is one we host.
 */
export function exampleAudioUrl(index: AudioIndex, example: LessonExample): string | undefined {
  return (
    usableAudioUrl(example.audio_url) ??
    usableAudioUrl(findAudio(index, { lexemeId: example.lexeme_id, kbp: example.kbp }))
  )
}
