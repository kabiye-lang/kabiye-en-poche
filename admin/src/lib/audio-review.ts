import { kbpKey } from './kbp-key'

export type AudioKind = 'word' | 'sentence'
export type AudioSource = 'native' | 'tts'
export type AudioStatus = 'pending' | 'approved' | 'rejected'

export interface AudioReviewFields {
  kind: AudioKind | null
  kbp_text: string | null
  lexeme_id: string | null
  source: AudioSource
  status: AudioStatus
}

export const DEFAULT_AUDIO_REVIEW: AudioReviewFields = {
  kind: null,
  kbp_text: null,
  lexeme_id: null,
  source: 'native',
  status: 'pending',
}

/**
 * True when the record was read after the audio review migration. Before it, the
 * columns do not exist and writing them makes PostgREST reject the whole update.
 */
export function hasReviewColumns(record: object | undefined): boolean {
  return !!record && 'status' in record
}

/** The review fields of a record, with the column defaults for missing values. */
export function readAudioReview(record: Record<string, unknown>): AudioReviewFields {
  return {
    kind: (record.kind as AudioKind | null) ?? null,
    kbp_text: (record.kbp_text as string | null) ?? null,
    lexeme_id: (record.lexeme_id as string | null) ?? null,
    source: (record.source as AudioSource | undefined) ?? 'native',
    status: (record.status as AudioStatus | undefined) ?? 'pending',
  }
}

/**
 * Why this audio cannot be approved, or null when it can. A word without a lexeme
 * could play for a same-spelling word with a different tone.
 */
export function approvalBlocker(record: Record<string, unknown> | AudioReviewFields): string | null {
  const text = typeof record.kbp_text === 'string' ? record.kbp_text : ''
  if (!kbpKey(text)) return 'Cannot approve: Kabiyè text is empty. Fill in what the recording says first.'
  const lexemeId = typeof record.lexeme_id === 'string' ? record.lexeme_id.trim() : ''
  if (record.kind === 'word' && !lexemeId) {
    return 'Cannot approve: a word needs a lexeme id, or it could play for a same-spelling word with a different tone.'
  }
  return null
}

/** Trim the typed review fields before a write and derive kbp_key from kbp_text. */
export function prepareAudioWrite<T extends Record<string, unknown>>(data: T): T {
  const out: Record<string, unknown> = { ...data }
  if ('lexeme_id' in data) out.lexeme_id = (typeof data.lexeme_id === 'string' && data.lexeme_id.trim()) || null
  if ('kbp_text' in data) {
    const text = typeof data.kbp_text === 'string' ? data.kbp_text.trim() : ''
    out.kbp_text = text || null
    out.kbp_key = kbpKey(text) || null
  }
  return out as T
}
