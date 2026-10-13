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
 * wrong word, so a word recording plays only for the exact lexeme asked for.
 *
 * Word lookups (the default) consider only rows with `kind = 'word'`. A word recording is
 * one form of one lexeme -- the pair (lexeme_id, kbp_key) -- because a lesson can show an
 * inflected form (`ɛcaɣ`) of a lexeme whose headword is another (`caɣʋ`).
 *
 * - Only a row filed under the caller's exact `lexemeId` AND that spelling plays. Ids are
 *   compared in NFC, so a headword typed or stored decomposed still finds its row.
 * - Without a `lexemeId` nothing plays. Every lesson example carries one, and a spelling
 *   alone could only ever pick the wrong lexeme.
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

  if (!lexemeId) return undefined
  const wanted = lexemeId.normalize('NFC')
  return records.find((record) => record.lexemeId?.normalize('NFC') === wanted)?.url
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
