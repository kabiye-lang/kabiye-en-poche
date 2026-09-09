import type { DictionaryEntry, DictionaryStatistics, EntryByTermResult, SearchResult } from '../types/dictionary'

import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'
import { resolveTranslation } from '../utils/dictionary-helpers'

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
      return (data ?? []).map((r) => {
        // The subtitle under each result should be what the word *means*. This used to
        // derive a definition only when searching by translation, so a Kabiyè search --
        // the default -- rendered every row as "kalimiye / kalimiye", the headword twice
        // and no gloss. Derive it for every mode, and fall back across languages, since
        // not every entry is glossed in both.
        const entryData = typeof r.entry_data === 'string' ? JSON.parse(r.entry_data) : r.entry_data
        const firstDef = entryData?.senses?.[0]?.definitions?.[0]
        // 'all' searches Kabiyè, so the reader's language decides which gloss to prefer.
        const preferred = language === 'all' ? 'en' : language
        const resolved = resolveTranslation(
          firstDef?.translations,
          preferred,
          firstDef?.definition ?? '',
          firstDef?.machine
        )

        return {
          ...r,
          entry_id: r.id,
          match_text: resolved.text || undefined,
          // Surfaced so a French gloss shown to an English reader can say so, the way
          // Word of the Day does. Without it the two lists disagree about the same entry.
          match_language: resolved.isFallback ? resolved.language : undefined,
          match_machine: resolved.isMachine || undefined,
        }
      }) as unknown as SearchResult[]
    },
    enabled: enabled && query.length >= 2,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

/**
 * Get a specific entry by headword (exact main headword only)
 * Use for known main entries; prefer useEntryByTerm for lexRef/crossRef links.
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
 * Get entry by any term: main headword, sub-entry (e.g. "agɔma ɖɩɣa₂"), variant, cross-ref.
 * Use for lexRef/crossRef links. Returns sub_entry_index when term is a sub-entry.
 * @param term - The term to look up (headword, sub-entry headword, variant, etc.)
 */
export function useEntryByTerm(term: string) {
  return useQuery({
    queryKey: ['dictionary', 'entry-by-term', term],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_entry_by_term', {
        term_param: term,
      })
      if (error) throw error
      return data?.[0] as unknown as EntryByTermResult | undefined
    },
    enabled: !!term,
    staleTime: Infinity,
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
 * How many entries start with a letter.
 *
 * `useEntriesByLetter` pages fifty at a time and so can only ever say "50+", but the
 * browse screen leads with the count -- it is the one number that tells a learner
 * whether a letter is a corner of the dictionary or a third of it. It reads the count
 * out of the alphabet, which is one cached request the screen already makes, rather
 * than asking the table again -- and so it folds case the same way the alphabet does.
 */
export function useLetterCount(letter: string) {
  const { data: letters } = useAvailableLetters()
  const key = letter.toLowerCase()
  return letters?.find((entry) => entry.letter === key)?.count
}

/**
 * Get random entries (for Word of the Day, etc.)
 * Prefer useWordOfTheDay for homograph-aware "one word" display.
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
 * Get random unique base headwords (homograph-aware).
 * Returns e.g. ["yiluu", "ɛgɔm"] instead of yiluu₁, yiluu₂, yiluu₃ separately.
 */
export function useRandomBaseHeadwords(count = 5) {
  return useQuery({
    queryKey: ['dictionary', 'random-bases', count],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_random_base_headwords', {
        base_count: count,
      })
      if (error) throw error
      return (data as { base_headword: string }[])?.map((r) => r.base_headword) ?? []
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

/**
 * Get all entries for a base headword (e.g. yiluu → [yiluu₁, yiluu₂, yiluu₃]).
 */
export function useEntriesByBaseHeadword(baseHeadword: string) {
  return useQuery({
    queryKey: ['dictionary', 'entries-by-base', baseHeadword],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_entries_by_base_headword', {
        base_param: baseHeadword,
      })
      if (error) throw error
      return (data as unknown as DictionaryEntry[]) ?? []
    },
    enabled: !!baseHeadword,
    staleTime: Infinity,
  })
}

/**
 * Word of the Day: random base headwords with all homographs.
 * Each item = { baseHeadword, entries } – display homographs together.
 */
export function useWordOfTheDay(count = 3) {
  const { data: baseHeadwords, isLoading: isLoadingBases } = useRandomBaseHeadwords(count)
  const entryQueries = useQueries({
    queries:
      baseHeadwords?.map((base) => ({
        queryKey: ['dictionary', 'entries-by-base', base] as const,
        queryFn: async () => {
          const { data, error } = await supabase.rpc('get_entries_by_base_headword', {
            base_param: base,
          })
          if (error) throw error
          return {
            baseHeadword: base,
            entries: (data as unknown as DictionaryEntry[]) ?? [],
          }
        },
        staleTime: Infinity,
      })) ?? [],
  })
  const wordGroups = entryQueries
    .filter((q) => q.data)
    .map((q) => q.data as { baseHeadword: string; entries: DictionaryEntry[] })
  const isLoading = isLoadingBases || entryQueries.some((q) => q.isLoading)
  return {
    data: wordGroups,
    isLoading,
    isError: entryQueries.some((q) => q.isError),
  }
}

/**
 * Get all available letters in the dictionary
 * Uses an RPC function to efficiently get distinct letters at the database level
 */
export function useAvailableLetters() {
  return useQuery({
    queryKey: ['dictionary', 'letters'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_letters' as never)

      if (error) throw error
      return (
        (data as { letter: string; entry_count: number }[])?.map((item) => ({
          letter: item.letter,
          count: Number(item.entry_count),
        })) || []
      )
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
