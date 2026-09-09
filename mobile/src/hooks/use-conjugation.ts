import type { Database } from '../types/db.types'

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
export function useConjugation(conjugation: { schema: string | null; classes: number[] } | null | undefined) {
  const schema = conjugation?.schema ?? null
  const classes = conjugation?.classes ?? []
  return useQuery({
    queryKey: ['dictionary', 'conjugation', schema, classes],
    enabled: Boolean(schema || classes.length > 0),
    staleTime: Infinity,
    queryFn: async (): Promise<Paradigm[]> => {
      const filters: string[] = []
      if (schema) filters.push(`and(source.eq.${SIL},key.eq.${schema})`)
      for (const c of classes) filters.push(`and(source.eq.${BOOK},key.eq.${c})`)
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
