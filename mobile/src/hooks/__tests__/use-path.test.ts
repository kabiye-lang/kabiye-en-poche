import { orderUnitsForPath, parsePath, PATH_UNIT_ORDER } from '../use-path'

// The five-level map's A1 units, in their stored `position` order.
const A1 = ['A1-01', 'A1-02', 'A1-03', 'A1-04', 'A1-05', 'A1-06', 'A1-07', 'A1-08'].map((code) => ({ code }))
const codes = (units: { code: string }[]) => units.map((u) => u.code)

describe('PATH_UNIT_ORDER keeps the onboarding promises', () => {
  // Each promise is the `sub` line under an option on the onboarding screen. If the unit
  // codes change again, these fail rather than every learner silently getting one order.
  it('"Start with the alphabet and spelling." -- the speaker begins at Writing & Sound', () => {
    expect(codes(orderUnitsForPath(A1, 'speaker'))[0]).toBe('A1-01')
  })

  it('"Start with greetings." -- the newcomer begins at Greetings & People, then the alphabet', () => {
    expect(codes(orderUnitsForPath(A1, 'new')).slice(0, 3)).toEqual(['A1-03', 'A1-01', 'A1-02'])
  })

  it('"Start with the words you half-remember." -- the heritage learner gets vocabulary before the spine', () => {
    const order = codes(orderUnitsForPath(A1, 'heritage'))
    expect(order[0]).toBe('A1-03')
    expect(order.indexOf('A1-06')).toBeLessThan(order.indexOf('A1-02'))
    expect(order.indexOf('A1-04')).toBeLessThan(order.indexOf('A1-02'))
  })

  it('every listed code exists on the map (a stale table reorders nothing)', () => {
    const known = new Set(codes(A1))
    for (const listed of Object.values(PATH_UNIT_ORDER).flat()) {
      expect(known.has(listed)).toBe(true)
    }
  })

  it('no path is empty: choosing one always means something', () => {
    for (const listed of Object.values(PATH_UNIT_ORDER)) expect(listed.length).toBeGreaterThan(0)
  })
})

describe('orderUnitsForPath', () => {
  it('never drops or duplicates a unit', () => {
    for (const path of ['speaker', 'heritage', 'new'] as const) {
      const ordered = orderUnitsForPath(A1, path)
      expect(ordered).toHaveLength(A1.length)
      expect(new Set(codes(ordered)).size).toBe(A1.length)
    }
  })

  it('leaves the order alone without a path', () => {
    expect(codes(orderUnitsForPath(A1, null))).toEqual(codes(A1))
  })

  it('keeps unlisted units in their stored order after the listed ones', () => {
    expect(codes(orderUnitsForPath(A1, 'new'))).toEqual([
      'A1-03',
      'A1-01',
      'A1-02',
      'A1-04',
      'A1-05',
      'A1-06',
      'A1-07',
      'A1-08',
    ])
  })
})

describe('parsePath', () => {
  it('accepts the three paths and nothing else', () => {
    expect(parsePath('speaker')).toBe('speaker')
    expect(parsePath('heritage')).toBe('heritage')
    expect(parsePath('new')).toBe('new')
    expect(parsePath('U001')).toBeNull()
    expect(parsePath(null)).toBeNull()
    expect(parsePath(undefined)).toBeNull()
  })
})
