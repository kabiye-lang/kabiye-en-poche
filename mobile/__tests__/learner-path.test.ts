/**
 * The path chosen at onboarding reorders the curriculum. These pin the reordering,
 * because getting it wrong is invisible -- the app still works, it just teaches the
 * wrong thing first to the audience the choice existed to serve.
 */

import { orderUnitsForPath, PATH_UNIT_ORDER } from '../src/hooks/use-path'

const UNITS = [
  { code: 'U001', title: 'Foundations I' },
  { code: 'U002', title: 'Numbers & Time' },
  { code: 'U003', title: 'Social Basics' },
  { code: 'U016', title: 'Core Vocabulary' },
]

const codes = (units: { code: string }[]) => units.map((u) => u.code)

describe('orderUnitsForPath', () => {
  it('puts the orthography first for someone who already speaks Kabiyè', () => {
    expect(codes(orderUnitsForPath(UNITS, 'speaker'))).toEqual(['U001', 'U003', 'U002', 'U016'])
  })

  it('puts greetings first for someone new to the language', () => {
    expect(codes(orderUnitsForPath(UNITS, 'new'))).toEqual(['U003', 'U001', 'U002', 'U016'])
  })

  it('leaves the default order for a heritage learner', () => {
    expect(codes(orderUnitsForPath(UNITS, 'heritage'))).toEqual(codes(UNITS))
  })

  it('leaves the default order when no path has been chosen', () => {
    expect(codes(orderUnitsForPath(UNITS, null))).toEqual(codes(UNITS))
  })

  it('keeps units the path does not mention, after the ones it does', () => {
    const ordered = orderUnitsForPath(UNITS, 'new')
    expect(ordered[ordered.length - 1].code).toBe('U016')
  })

  it('never drops or duplicates a unit', () => {
    for (const path of ['speaker', 'heritage', 'new'] as const) {
      const ordered = orderUnitsForPath(UNITS, path)
      expect(ordered).toHaveLength(UNITS.length)
      expect(new Set(codes(ordered)).size).toBe(UNITS.length)
    }
  })

  it('orders every path against codes that exist', () => {
    const known = new Set(UNITS.map((u) => u.code))
    for (const preferred of Object.values(PATH_UNIT_ORDER)) {
      for (const code of preferred) expect(known.has(code)).toBe(true)
    }
  })
})
