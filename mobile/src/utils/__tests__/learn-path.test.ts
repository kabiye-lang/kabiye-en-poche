import { partitionLearnPath } from '../learn-path'

const U = (
  id: string,
  title: string,
  status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null = 'available'
) => ({ id, title, status })

const L = (
  id: string,
  unit_id: string,
  position: number,
  status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null = 'available'
) => ({ id, unit_id, position, status })

describe('partitionLearnPath', () => {
  it('excludes coming_soon lessons from their unit and counts them', () => {
    const units = [U('writing', 'Writing & Sound')]
    const lessons = [L('a', 'writing', 1), L('b', 'writing', 2, 'coming_soon')]

    const { units: result, coming } = partitionLearnPath(units, lessons)

    expect(result).toHaveLength(1)
    expect(result[0].lessons.map((l) => l.id)).toEqual(['a'])
    expect(coming.count).toBe(1)
  })

  it('lists maintenance lessons in their unit', () => {
    const units = [U('writing', 'Writing & Sound')]
    const lessons = [L('a', 'writing', 1, 'maintenance')]

    const { units: result } = partitionLearnPath(units, lessons)

    expect(result[0].lessons.map((l) => l.id)).toEqual(['a'])
  })

  it('hides every lesson of a unit pulled for maintenance or disabled, even ones marked available', () => {
    const units = [U('fixing', 'Being Fixed', 'maintenance'), U('gone', 'Gone', 'disabled'), U('open', 'Open')]
    const lessons = [L('a', 'fixing', 1), L('b', 'gone', 1), L('c', 'gone', 2, 'coming_soon'), L('d', 'open', 1)]

    const { units: result, coming } = partitionLearnPath(units, lessons)

    expect(result.map((r) => r.unit.id)).toEqual(['open'])
    expect(coming.count).toBe(0)
    expect(coming.unitTitles).toEqual([])
  })

  it('lists nothing from a coming_soon unit and counts all it holds, whatever its lessons say', () => {
    const units = [U('future', 'Future Unit', 'coming_soon')]
    const lessons = [L('a', 'future', 1), L('b', 'future', 2, 'coming_soon'), L('c', 'future', 3, 'disabled')]

    const { units: result, coming } = partitionLearnPath(units, lessons)

    expect(result).toEqual([])
    expect(coming.count).toBe(2)
    expect(coming.unitTitles).toEqual(['Future Unit'])
  })

  it('counts the unwritten lessons of an open unit but does not name the unit as coming', () => {
    const units = [U('greetings', 'Greetings & People'), U('future', 'Future Unit', 'coming_soon')]
    const lessons = [L('a', 'greetings', 1), L('b', 'greetings', 2, 'coming_soon')]

    const { units: result, coming } = partitionLearnPath(units, lessons)

    expect(result.map((r) => r.unit.id)).toEqual(['greetings'])
    expect(coming.count).toBe(1)
    expect(coming.unitTitles).toEqual(['Future Unit'])
  })

  it('hides disabled lessons everywhere -- not listed, not counted as coming', () => {
    const units = [U('writing', 'Writing & Sound')]
    const lessons = [L('a', 'writing', 1), L('b', 'writing', 2, 'disabled')]

    const { units: result, coming } = partitionLearnPath(units, lessons)

    expect(result[0].lessons.map((l) => l.id)).toEqual(['a'])
    expect(coming.count).toBe(0)
    expect(coming.unitTitles).toEqual([])
  })

  it('drops a unit that only holds coming_soon lessons, and names it in coming', () => {
    const units = [U('writing', 'Writing & Sound'), U('greetings', 'Greetings & People')]
    const lessons = [L('a', 'writing', 1, 'coming_soon'), L('b', 'greetings', 1)]

    const { units: result, coming } = partitionLearnPath(units, lessons)

    expect(result.map((r) => r.unit.id)).toEqual(['greetings'])
    expect(coming.unitTitles).toEqual(['Writing & Sound'])
    expect(coming.count).toBe(1)
  })

  it('names a unit in coming even with no lessons at all, when its own status is coming_soon', () => {
    const units = [U('future', 'Future Unit', 'coming_soon')]

    const { units: result, coming } = partitionLearnPath(units, [])

    expect(result).toHaveLength(0)
    expect(coming.unitTitles).toEqual(['Future Unit'])
    expect(coming.count).toBe(0)
  })

  it('treats a null-status unit as an ordinary, written one', () => {
    const units = [U('writing', 'Writing & Sound', null)]
    const lessons = [L('a', 'writing', 1)]

    const { units: result, coming } = partitionLearnPath(units, lessons)

    expect(result.map((r) => r.unit.id)).toEqual(['writing'])
    expect(coming.unitTitles).toEqual([])
  })

  it('treats a null-status lesson as written', () => {
    const units = [U('writing', 'Writing & Sound')]
    const lessons = [L('a', 'writing', 1, null)]

    const { units: result } = partitionLearnPath(units, lessons)

    expect(result[0].lessons.map((l) => l.id)).toEqual(['a'])
  })

  it('keeps units in path order and lessons in position order', () => {
    const units = [U('greetings', 'Greetings & People'), U('writing', 'Writing & Sound')]
    const lessons = [L('b', 'writing', 2), L('a', 'writing', 1), L('hello', 'greetings', 1)]

    const { units: result } = partitionLearnPath(units, lessons)

    expect(result.map((r) => r.unit.id)).toEqual(['greetings', 'writing'])
    expect(result[1].lessons.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('deduplicates a unit named in coming even when several of its lessons are coming_soon', () => {
    const units = [U('writing', 'Writing & Sound')]
    const lessons = [L('a', 'writing', 1, 'coming_soon'), L('b', 'writing', 2, 'coming_soon')]

    const { coming } = partitionLearnPath(units, lessons)

    expect(coming.unitTitles).toEqual(['Writing & Sound'])
    expect(coming.count).toBe(2)
  })
})
