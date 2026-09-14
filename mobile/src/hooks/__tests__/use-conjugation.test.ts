// The hook module reaches for the Supabase client at import; the filter builder needs none of it.
jest.mock('../../lib/supabase', () => ({ supabase: {} }))

import { BOOK, paradigmFilters, SIL } from '../use-conjugation'

describe('paradigmFilters -- which tables an entry asks for', () => {
  it('a subgroup the sketch prints: that one key, and the book class', () => {
    expect(paradigmFilters({ schema: '3c', schemaKeys: ['3c'], schemaPrinted: true, classes: [20] })).toEqual([
      `and(source.eq.${SIL},key.in.(3c))`,
      `and(source.eq.${BOOK},key.eq.20)`,
    ])
  })

  it('a parent code the entry prints without its subgroup: every printed subgroup', () => {
    expect(paradigmFilters({ schema: '3', schemaKeys: ['3a', '3b', '3c', '3d', '3n'], schemaPrinted: true, classes: [] })).toEqual([
      `and(source.eq.${SIL},key.in.(3a,3b,3c,3d,3n))`,
    ])
  })

  it('a code no page prints asks the sketch for nothing', () => {
    expect(paradigmFilters({ schema: '6n', schemaKeys: [], schemaPrinted: false, classes: [] })).toEqual([])
  })

  it('a row loaded before the keys existed still asks for its schema', () => {
    expect(paradigmFilters({ schema: '1a', classes: [] })).toEqual([`and(source.eq.${SIL},key.in.(1a))`])
    expect(paradigmFilters(null)).toEqual([])
  })
})
