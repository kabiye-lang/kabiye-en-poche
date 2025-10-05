import type { Database } from './supabase'

// Base types from Supabase
type DbDictionaryEntry = Database['public']['Tables']['dictionary_entries']['Row']
type DbSearchResult = Database['public']['Functions']['search_dictionary']['Returns'][number]
type DbDictionaryStats = Database['public']['Views']['dictionary_statistics']['Row']

export interface DictionaryEntry extends Omit<DbDictionaryEntry, 'entry_data'> {
  entry_data: EntryData
}

export interface EntryData {
  letter: string
  headword: string
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
}

export interface SearchResult extends Omit<DbSearchResult, 'entry_data'> {
  entry_data: EntryData
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
