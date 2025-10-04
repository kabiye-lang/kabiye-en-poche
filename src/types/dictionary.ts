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
  variantRefs: { variant: string; pronunciation?: string }[]
  pronunciations: string[]
  crossRefs: { type: string; targets: string[] }[]
  lexRefs: { type: string; targets: string[] }[]
  grammaticalInfo?: string
  senses: {
    definitions: {
      definition: string
      grammar?: string
      translations: {
        fr: string
        en: string
      }
    }[]
    examples: { source?: string; translation?: string }[]
  }[]
  subEntries: {
    type: string
    headword: string
    senses: {
      definitions: {
        definition: string
        grammar?: string
        translations: {
          fr: string
          en: string
        }
      }[]
      examples: { source?: string; translation?: string }[]
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
