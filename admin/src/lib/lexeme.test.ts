import { describe, expect, it, vi } from 'vitest'

const entries = [
  { headword: 'keɖe', entry_data: { headword: 'keɖe', homograph_number: 1 } },
  { headword: 'keɖe', entry_data: { headword: 'keɖe', homograph_number: 'x' } },
]

vi.mock('@/supabase', () => {
  const builder = {
    select: () => builder,
    ilike: () => builder,
    order: () => builder,
    limit: async () => ({ data: entries, error: null }),
  }
  return { supabase: { from: () => builder } }
})

const { searchLexemes } = await import('./lexeme')

describe('searchLexemes', () => {
  it('drops an entry whose homograph number is not a whole number, instead of offering keɖe#NaN', async () => {
    expect((await searchLexemes('keɖe')).map((option) => option.lexemeId)).toEqual(['keɖe#1'])
  })
})
