import { supabase } from '@/supabase'

import { kbpKey } from './kbp-key'
import { lexemeExists } from './lexeme'

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
 * The row as it will be stored: trimmed text and lexeme id, kbp_key always derived
 * from kbp_text (never taken from the caller), and no lexeme id on a sentence.
 * The app matches word audio by lexeme id, so a sentence carrying one could be
 * played for that word.
 */
export function normaliseAudio(row: Record<string, unknown>): Record<string, unknown> {
  const text = typeof row.kbp_text === 'string' ? row.kbp_text.trim() : ''
  const lexemeId = typeof row.lexeme_id === 'string' ? row.lexeme_id.trim().normalize('NFC') : ''
  return {
    ...row,
    kbp_text: text || null,
    kbp_key: kbpKey(text) || null,
    lexeme_id: row.kind === 'sentence' ? null : lexemeId || null,
  }
}

/** Why this normalised row cannot be approved without a lookup, or null. */
function approvalBlocker(row: Record<string, unknown>): string | null {
  if (row.source === 'tts')
    return 'Cannot approve: the app never plays TTS recordings. Only native ones can be approved.'
  if (!row.kbp_key) return 'Cannot approve: Kabiyè text is empty. Fill in what the recording says first.'
  if (row.kind !== 'word' && row.kind !== 'sentence') return 'Cannot approve: set the kind (word or sentence) first.'
  if (row.kind === 'word' && !row.lexeme_id) {
    return 'Cannot approve: a word needs a lexeme id, or it could play for a same-spelling word with a different tone.'
  }
  return null
}

/**
 * True when both rows would answer the same lookup in the app: words by
 * (lexeme_id, kbp_key), sentences by kbp_key. The app would pick one arbitrarily.
 */
export function sameLookup(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  if (a.kind !== b.kind || a.kbp_key !== b.kbp_key) return false
  return a.kind === 'sentence' || a.lexeme_id === b.lexeme_id
}

export function duplicateMessage(existingName: unknown, row: Record<string, unknown>): string {
  const what = row.kind === 'word' ? `word ${row.lexeme_id} "${row.kbp_key}"` : `sentence "${row.kbp_key}"`
  return `Cannot approve: approved audio "${String(existingName)}" already covers the ${what}. Reject one of them.`
}

/**
 * Why a row cannot end up approved, or null when it can. Give it the merged,
 * normalised row (with its id when it exists), never a patch.
 */
export async function checkApproval(input: Record<string, unknown>): Promise<string | null> {
  const row = normaliseAudio(input)
  const blocker = approvalBlocker(row)
  if (blocker) return blocker
  if (row.kind === 'word' && !(await lexemeExists(String(row.lexeme_id)))) {
    return `Cannot approve: lexeme id "${row.lexeme_id}" is not in the dictionary.`
  }
  // The generated types do not list the review columns yet, hence the untyped filters.
  let query = supabase
    .from('audios')
    .select('*')
    .filter('status', 'eq', 'approved')
    .filter('source', 'eq', 'native')
    .filter('kind', 'eq', String(row.kind))
    .filter('kbp_key', 'eq', String(row.kbp_key))
  if (row.kind === 'word') query = query.filter('lexeme_id', 'eq', String(row.lexeme_id))
  if (row.id != null) query = query.neq('id', String(row.id))
  const { data, error } = await query.limit(1)
  if (error) throw new Error(error.message)
  const existing = data?.[0]
  return existing ? duplicateMessage(existing.name, row) : null
}
