import type { Database } from './supabase'

// Base types from Supabase
type DbDictionaryEntry = Database['public']['Tables']['dictionary_entries']['Row']
type DbSearchResult = Database['public']['Functions']['search_dictionary']['Returns'][number]
type _DbDictionaryStats = Database['public']['Views']['dictionary_statistics']['Row']

export interface DictionaryEntry extends Omit<DbDictionaryEntry, 'entry_data'> {
  entry_data: EntryData
}

/**
 * Where a verb's tables are. `schemaKeys` is what to query: the entry's own subgroup
 * when the sketch prints a table for it; every printed subgroup of the schema when the
 * entry names only the parent (`v.3`); nothing when no page prints the code, which
 * `schemaPrinted: false` says so the screen can say it too. Rows loaded before the keys
 * existed carry only `schema`.
 */
export interface Conjugation {
  schema: string | null
  schemaKeys?: string[]
  schemaPrinted?: boolean | null
  classes: number[]
}

/**
 * Links to other words, by type. `conditions` says when a form is used, by target:
 * `ɛ-` "devant les voyelles a, ɛ, ɩ, ɔ et ʋ" on `e-` (print p. 110). `en` is null when
 * the pipeline has no English for the wording.
 */
export interface LexRef {
  type: string
  targets: string[]
  conditions?: Record<string, { fr: string; en: string | null }>
}

export interface EntryData {
  letter: string
  headword: string
  /** Base form without subscript (e.g. "yiluu" for yiluu₁) */
  base_headword?: string
  /** Subscript value 1–9, or null if not a homograph */
  homograph_number?: number | null
  plural?: string
  mainEntry?: string // If present, this is a redirect entry - fetch this headword for full definition
  variantRefs: { variant: string; pronunciation?: string }[]
  pronunciations: string[]
  crossRefs: { type: string; targets: string[] }[]
  grammaticalInfo?: string
  senses: {
    senseNumber?: string | number // Sense number for display
    definitions: {
      definition: string
      grammar?: string
      translations: {
        fr: string
        en: string
      }
      /** Sides that were machine-translated from the other one; the reader is told. */
      machine?: ('fr' | 'en')[]
      /** Where this definition was printed, as `<corpus>:p<page>` tags: `ak-livret-2019:p21`. */
      sources?: string[]
    }[]
    examples: { source?: string; translation?: string }[]
    lexRefs: LexRef[] // Moved from entry level to sense level
  }[]
  subEntries: {
    type: string
    headword: string
    senses: {
      senseNumber?: string | number
      definitions: {
        definition: string
        grammar?: string
        translations: {
          fr: string
          en: string
        }
      }[]
      examples: { source?: string; translation?: string }[]
      lexRefs: LexRef[]
    }[]
  }[]
  publishRoot?: string
  htmlContent?: string
  /** Which corpora this entry came from, in prose: "SIL 1999 dictionary", "Webonary". */
  sources?: string[]
  /**
   * Where each field came from, as `<corpus>:p<page>` tags.
   *
   * The page number is the only thing the entry screen takes from it: a learner who
   * doubts a definition should be able to go and look it up.
   */
  provenance?: Record<string, string[][]>
  /** Printed with a dagger: a dialectal variant whose main word is the first cross-reference. */
  dialectal?: boolean
  /** "viendrait de fr. Noël", "dérivé de halʋ et kpaɣʋ" -- where a word came from. */
  etymology?: string[]
  /**
   * Where a verb's conjugation tables are: the SIL sketch's schema from the entry's own
   * `v.3b`, and the 2013 conjugation book's class(es) from its index. Verbs only.
   */
  conjugation?: Conjugation | null
  /**
   * The forms a pronoun, determiner or modifier takes with each noun class, as the SIL
   * print tables them: `[class code, form]` rows (`["kA", "ŋga"]` under ɛnʋ, SIL p. 121), with the page.
   */
  classTable?: { rows: [string, string][]; sources?: string[] } | null
}

export interface SearchResult extends Omit<DbSearchResult, 'entry_data'> {
  entry_data: EntryData
  /** Alias for id (DB returns id) */
  entry_id: string
  /** Matched text snippet; use headword as fallback when absent */
  match_text?: string
  /** Set when match_text had to fall back to the other language. */
  match_language?: 'fr' | 'en'
  /** The gloss shown is a machine translation of the dictionary's wording. */
  match_machine?: boolean
}

/** Response from get_entry_by_term – includes resolution metadata */
export interface EntryByTermResult extends DictionaryEntry {
  matched_term: string
  term_type: 'main_headword' | 'sub_entry_headword' | 'variant' | string
  /** 0-based index in entry_data.subEntries when term is a sub-entry */
  sub_entry_index: number | null
}

export interface DictionaryStatistics {
  total_entries: number | null
  total_letters: number | null
  french_definitions: number | null
  english_definitions: number | null
  primary_headwords: number | null
  sub_entries: number | null
  variants: number | null
}
