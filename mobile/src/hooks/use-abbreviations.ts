import type { Abbreviation, AbbreviationTable } from '../utils/grammatical-info'

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'

/**
 * The dictionary's abbreviations with their meanings, as a map by code.
 *
 * Ninety-odd rows that never change between loads of the lexicon: fetched once and kept.
 * An empty map while loading or offline means the entry screen shows the bare code, as
 * it always did, rather than nothing.
 */
export function useAbbreviations() {
  return useQuery({
    queryKey: ['dictionary', 'abbreviations'],
    queryFn: async (): Promise<AbbreviationTable> => {
      const { data, error } = await supabase.from('dictionary_abbreviations').select('*')
      if (error) throw error
      return new Map((data ?? []).map((row) => [row.code, row as unknown as Abbreviation]))
    },
    staleTime: Infinity,
  })
}
