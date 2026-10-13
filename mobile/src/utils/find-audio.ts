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
 * Kabiyè does not write tone, so a spelling alone does not name a word: `keɖe#1` and
 * `keɖe#2` are spelled alike and may be said differently. Silence beats teaching the
 * wrong word, so a word recording plays only when nothing else could be meant.
 *
 * Word lookups (the default) consider only rows with `kind = 'word'`. A word recording is
 * one form of one lexeme -- the pair (lexeme_id, kbp_key) -- because a lesson can show an
 * inflected form (`ɛcaɣ`) of a lexeme whose headword is another (`caɣʋ`).
 *
 * - With a `lexemeId`: only a row filed under that exact lexeme AND that spelling. No
 *   spelling fallback at all.
 * - Without one: a row whose spelling matches, filed under a lexeme id with no `#n`. A
 *   numbered lexeme means same-spelling siblings exist. Exactly one lexeme may remain.
 * - A word row with no lexeme id is never played.
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

  const key = kbpKey(kbp)
  if (!key) return undefined
  const records = index.records.filter((record) => record.kind === kind && record.kbpKey === key)

  if (kind === 'sentence') return records[0]?.url

  if (lexemeId) return records.find((record) => record.lexemeId === lexemeId)?.url

  const candidates = records.filter((record) => record.lexemeId !== null && !record.lexemeId.includes('#'))
  const lexemes = new Set(candidates.map((record) => record.lexemeId))
  return lexemes.size === 1 ? candidates[0].url : undefined
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
