import type { Database } from '../types/db.types'
import type { Conjugation } from '../types/dictionary'

import { useQuery } from '@tanstack/react-query'

import { supabase } from '../lib/supabase'

export type Paradigm = Omit<Database['public']['Tables']['verb_paradigms']['Row'], 'forms'> & {
  forms: Record<string, string>
}
export type VerbForm = Database['public']['Tables']['verb_forms']['Row']

export const SIL = 'sil1999_print'
export const BOOK = 'harmattan-conjugaison-2013'

/**
 * The conjugation tables a verb entry points at.
 *
 * Neither work gives the forms of every verb, only of the model verb of each pattern, so
 * what comes back is the pattern's tables: the sketch's model verbs for the schema the
 * entry prints (`v.3c` -> "3c"), and the book's model verb for the class its index gives.
 * The screen shows those as they were printed and says whose they are; it never fills
 * in the entry's own forms, which no source has written down.
 */
/** The keys the sketch is asked for: the entry's own list, or its schema for a row loaded before the list existed. */
export function sketchKeys(conjugation: Conjugation | null | undefined): string[] {
  if (!conjugation) return []
  if (conjugation.schemaKeys) return conjugation.schemaKeys
  return conjugation.schema ? [conjugation.schema] : []
}

/** The PostgREST filters for the tables an entry points at, one per work. */
export function paradigmFilters(conjugation: Conjugation | null | undefined): string[] {
  const filters: string[] = []
  const keys = sketchKeys(conjugation)
  if (keys.length > 0) filters.push(`and(source.eq.${SIL},key.in.(${keys.join(',')}))`)
  for (const c of conjugation?.classes ?? []) filters.push(`and(source.eq.${BOOK},key.eq.${c})`)
  return filters
}

export function useConjugation(conjugation: Conjugation | null | undefined) {
  const filters = paradigmFilters(conjugation)
  return useQuery({
    queryKey: ['dictionary', 'conjugation', filters],
    enabled: filters.length > 0,
    staleTime: Infinity,
    queryFn: async (): Promise<Paradigm[]> => {
      const { data, error } = await supabase.from('verb_paradigms').select('*').or(filters.join(','))
      if (error) throw error
      return (data ?? []) as unknown as Paradigm[]
    },
  })
}

/** What each row of a table means, by the form name the table writes. */
export function useVerbForms() {
  return useQuery({
    queryKey: ['dictionary', 'verb-forms'],
    staleTime: Infinity,
    queryFn: async (): Promise<Map<string, VerbForm>> => {
      const { data, error } = await supabase.from('verb_forms').select('*')
      if (error) throw error
      return new Map((data ?? []).map((row) => [row.code, row]))
    },
  })
}
