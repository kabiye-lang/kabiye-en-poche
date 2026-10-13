import { stripToneMarks } from '@/lib/kbp-key'
import { supabase } from '@/supabase'

/** A dictionary entry as the lexeme lookup shows it. */
export interface LexemeOption {
  lexemeId: string
  headword: string
  homographNumber: number | null
  tone: string | null
  gloss: string | null
}

interface EntryData {
  headword?: string
  homograph_number?: number | string | null
  tone?: string | null
  senses?: { definitions?: { definition?: string; translations?: { en?: string; fr?: string } }[] }[]
  frenchGlosses?: string[]
}

/** Lexeme id of a dictionary entry: `headword`, or `headword#n` for a homograph. */
export function lexemeIdOf(headword: string, homographNumber: number | string | null | undefined): string {
  return homographNumber == null || homographNumber === '' ? headword : `${headword}#${homographNumber}`
}

/** Split a lexeme id back into headword and homograph number. Headwords never contain '#'. */
export function parseLexemeId(lexemeId: string): { headword: string; homographNumber: string | null } {
  const match = /^(.+)#(\d+)$/.exec(lexemeId)
  return match ? { headword: match[1], homographNumber: match[2] } : { headword: lexemeId, homographNumber: null }
}

export function toLexemeOption(entry: { headword: string; entry_data: unknown }): LexemeOption {
  const data = (entry.entry_data ?? {}) as EntryData
  const headword = data.headword ?? entry.headword
  const homograph = data.homograph_number == null || data.homograph_number === '' ? null : Number(data.homograph_number)
  const definition = data.senses?.[0]?.definitions?.[0]
  const gloss =
    definition?.translations?.en || definition?.translations?.fr || definition?.definition || data.frenchGlosses?.[0]
  return {
    lexemeId: lexemeIdOf(headword, homograph),
    headword,
    homographNumber: homograph,
    tone: data.tone || null,
    gloss: gloss || null,
  }
}

/** Dictionary entries whose headword starts with the term, tone marks ignored. */
export async function searchLexemes(term: string): Promise<LexemeOption[]> {
  const prefix = stripToneMarks(term.trim()).replace(/[\\%_]/g, (c) => `\\${c}`)
  if (!prefix) return []
  const { data, error } = await supabase
    .from('dictionary_entries')
    .select('headword, entry_data')
    .ilike('headword', `${prefix}%`)
    .order('headword')
    .limit(30)
  if (error) throw new Error(error.message)
  return (data ?? []).map(toLexemeOption).sort((a, b) => a.lexemeId.localeCompare(b.lexemeId))
}

/** True when the lexeme id names an existing dictionary entry. */
export async function lexemeExists(lexemeId: string): Promise<boolean> {
  const { headword, homographNumber } = parseLexemeId(lexemeId)
  const { data, error } = await supabase
    .from('dictionary_entries')
    .select('headword, entry_data')
    .eq('headword', headword)
  if (error) throw new Error(error.message)
  return (data ?? []).some((entry) => toLexemeOption(entry).lexemeId === lexemeIdOf(headword, homographNumber))
}
