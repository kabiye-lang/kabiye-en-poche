import { lockStates, nextLesson } from '../lesson-locks'

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

describe('nextLesson', () => {
  const U = (id: string, status: 'available' | 'coming_soon' = 'available') => ({ id, status })
  const R = (id: string, unit_id: string, position: number, status: 'available' | 'coming_soon' = 'available') => ({
    id,
    unit_id,
    position,
    status,
  })
  const units = [U('writing'), U('spine'), U('greetings')]
  const lessons = [
    R('alphabet', 'writing', 1),
    R('eight-letters', 'writing', 2, 'coming_soon'),
    R('vowels', 'writing', 3),
    R('joining', 'spine', 1),
    R('hello', 'greetings', 1),
    R('names', 'greetings', 2),
  ]

  it('starts at the first open lesson of the first unit in the given order', () => {
    expect(nextLesson(units, lessons, new Set())?.id).toBe('alphabet')
  })

  it('follows the unit order it is handed, so a path changes the answer', () => {
    const forBeginner = [units[2], units[0], units[1]]
    expect(nextLesson(forBeginner, lessons, new Set())?.id).toBe('hello')
  })

  it('skips finished lessons and unbuilt ones alike', () => {
    expect(nextLesson(units, lessons, new Set(['alphabet']))?.id).toBe('vowels')
  })

  it('moves to the next unit when a unit is finished', () => {
    expect(nextLesson(units, lessons, new Set(['alphabet', 'vowels']))?.id).toBe('joining')
  })

  it('never resumes inside a unit that is not open', () => {
    const closed = [U('writing', 'coming_soon'), U('spine')]
    expect(nextLesson(closed, lessons, new Set())?.id).toBe('joining')
  })

  it('is null when everything open is done', () => {
    expect(nextLesson(units, lessons, new Set(['alphabet', 'vowels', 'joining', 'hello', 'names']))).toBeNull()
  })

  it('orders lessons by position, not by the order the rows arrived in', () => {
    const shuffled = [lessons[5], lessons[4]]
    expect(nextLesson([units[2]], shuffled, new Set())?.id).toBe('hello')
  })
})
