import { lockStates } from '../lesson-locks'

const L = (id: string, status: 'available' | 'coming_soon' = 'available') => ({ id, status })

describe('lockStates', () => {
  it('opens the first lesson and gates each on the one before it', () => {
    expect(lockStates([L('a'), L('b'), L('c')], new Set())).toEqual([false, true, true])
    expect(lockStates([L('a'), L('b'), L('c')], new Set(['a']))).toEqual([false, false, true])
  })

  it('an unbuilt lesson never gates the built lesson after it', () => {
    // Alphabet (done) -> The Eight Letters (not yet generated) -> Vowel Harmony (has content)
    const path = [L('alphabet'), L('eight-letters', 'coming_soon'), L('vowel-harmony')]
    expect(lockStates(path, new Set(['alphabet']))).toEqual([false, true, false])
  })

  it('an unbuilt lesson is itself always locked', () => {
    expect(lockStates([L('a', 'coming_soon')], new Set())).toEqual([true])
  })

  it('the gate is the nearest open lesson, however many unbuilt ones sit between', () => {
    const path = [L('a'), L('x', 'coming_soon'), L('y', 'coming_soon'), L('b')]
    expect(lockStates(path, new Set())).toEqual([false, true, true, true])
    expect(lockStates(path, new Set(['a']))).toEqual([false, true, true, false])
  })
})
