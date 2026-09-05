import { dealColumns } from '../src/components/lesson-steps/match-pairs-step'

const PAIRS = [
  { left: 'sɔnɔ', right: 'today' },
  { left: 'caa', right: 'father' },
  { left: 'lɩm', right: 'water' },
]

describe('dealColumns', () => {
  it('never leaves a row holding its own match', () => {
    const rightFor = new Map(PAIRS.map((p) => [p.left, p.right]))
    // Three pairs align by chance one deal in six, so a single run proves nothing.
    for (let i = 0; i < 200; i++) {
      const { left, right } = dealColumns(PAIRS)
      expect(left.every((l, idx) => rightFor.get(l) !== right[idx])).toBe(true)
    }
  })

  it('deals every item exactly once on both sides', () => {
    const { left, right } = dealColumns(PAIRS)
    expect([...left].sort()).toEqual(PAIRS.map((p) => p.left).sort())
    expect([...right].sort()).toEqual(PAIRS.map((p) => p.right).sort())
  })

  it('terminates on a degenerate set it cannot derange', () => {
    // One pair has no other row to move to; the bounded retry must still return.
    const single = [{ left: 'caa', right: 'father' }]
    const { left, right } = dealColumns(single)
    expect(left).toEqual(['caa'])
    expect(right).toEqual(['father'])
  })
})
