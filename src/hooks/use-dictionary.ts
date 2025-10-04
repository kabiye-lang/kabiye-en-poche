import type { DictionaryEntry, DictionaryStatistics, SearchResult } from '@/types/dictionary'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'

/**
 * Search dictionary entries
 * @param query - Search query string
 * @param language - Language to search in: 'all', 'fr', or 'en'
 * @param enabled - Whether the query should run
 */
export function useSearchDictionary(query: string, language: 'all' | 'fr' | 'en' = 'all', enabled = true) {
  return useQuery({
    queryKey: ['dictionary', 'search', query, language],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_dictionary', {
        search_query: query,
        search_language: language,
        result_limit: 20,
      })
      if (error) throw error
      return data as unknown as SearchResult[]
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

/**
 * Get a specific entry by headword
 * @param headword - The headword to look up
 */
export function useEntry(headword: string) {
  return useQuery({
    queryKey: ['dictionary', 'entry', headword],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_entry_by_headword', {
        headword_param: headword,
      })
      if (error) throw error
      return data?.[0] as unknown as DictionaryEntry | undefined
    },
    enabled: !!headword,
    staleTime: Infinity, // Entries never change
  })
}

/**
 * Browse entries by letter with infinite scroll pagination
 * @param letter - The letter to browse
 */
export function useEntriesByLetter(letter: string) {
  return useInfiniteQuery({
    queryKey: ['dictionary', 'letter', letter],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase.rpc('get_entries_by_letter', {
        letter_param: letter,
        page_limit: 50,
        page_offset: pageParam,
      })
      if (error) throw error
      return data as unknown as DictionaryEntry[]
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined
    },
    initialPageParam: 0,
    enabled: !!letter,
    staleTime: Infinity,
  })
}

/**
 * Get random entries (for Word of the Day, etc.)
 * @param count - Number of random entries to fetch
 */
export function useRandomEntries(count = 5) {
  return useQuery({
    queryKey: ['dictionary', 'random', count],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_random_entries', {
        entry_count: count,
      })
      if (error) throw error
      return data as unknown as DictionaryEntry[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

/**
 * Get all available letters in the dictionary
 */
export function useAvailableLetters() {
  return useQuery({
    queryKey: ['dictionary', 'letters'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dictionary_entries').select('letter').order('letter')

      if (error) throw error
      return [...new Set(data?.map((item) => item.letter) || [])]
    },
    staleTime: Infinity,
  })
}

/**
 * Get dictionary statistics
 */
export function useDictionaryStats() {
  return useQuery({
    queryKey: ['dictionary', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dictionary_statistics').select('*').single()

      if (error) throw error
      return data as DictionaryStatistics
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}
