import type { Database } from './supabase'

// Base types from Supabase
type DbDictionaryEntry = Database['public']['Tables']['dictionary_entries']['Row']
type DbSearchResult = Database['public']['Functions']['search_dictionary']['Returns'][number]
type _DbDictionaryStats = Database['public']['Views']['dictionary_statistics']['Row']

export interface DictionaryEntry extends Omit<DbDictionaryEntry, 'entry_data'> {
  entry_data: EntryData
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
    }[]
    examples: { source?: string; translation?: string }[]
    lexRefs: { type: string; targets: string[] }[] // Moved from entry level to sense level
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
      lexRefs: { type: string; targets: string[] }[]
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
}

export interface SearchResult extends Omit<DbSearchResult, 'entry_data'> {
  entry_data: EntryData
  /** Alias for id (DB returns id) */
  entry_id: string
  /** Matched text snippet; use headword as fallback when absent */
  match_text?: string
  /** Set when match_text had to fall back to the other language. */
  match_language?: 'fr' | 'en'
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
