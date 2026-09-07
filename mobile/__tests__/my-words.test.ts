import type { MyWord } from '../src/hooks/use-my-words'

import { mergeWords, recordWritten } from '../src/hooks/use-my-words'

/**
 * "My words" is the only honest count the app has.
 *
 * There is no account, so this list is the whole record of what a learner has met, and
 * Profile reports it instead of a percentage of a curriculum that is 7/78 written. The
 * merge must never lose a word that was already written -- finishing a lesson twice
 * would otherwise reset it to unwritten.
 */

const word = (headword: string, writtenCount = 0): MyWord => ({
  headword,
  firstSeen: '2026-01-01T00:00:00.000Z',
  writtenCount,
})

describe('mergeWords', () => {
  it('adds words the learner has not met before', () => {
    const out = mergeWords([], [{ headword: 'sɛtʋ' }, { headword: 'alaafɩya' }])
    expect(out.map((w) => w.headword)).toEqual(['sɛtʋ', 'alaafɩya'])
    expect(out.every((w) => w.writtenCount === 0)).toBe(true)
  })

  it('never resets a word that was already written', () => {
    // Finishing the same lesson a second time must not undo having spelled it.
    const out = mergeWords([word('sɛtʋ', 3)], [{ headword: 'sɛtʋ' }])
    expect(out).toHaveLength(1)
    expect(out[0].writtenCount).toBe(3)
  })

  it('keeps the first time a word was seen', () => {
    const out = mergeWords([word('sɛtʋ')], [{ headword: 'sɛtʋ' }])
    expect(out[0].firstSeen).toBe('2026-01-01T00:00:00.000Z')
  })

  it('ignores an empty headword rather than storing a blank row', () => {
    expect(mergeWords([], [{ headword: '' }])).toEqual([])
  })

  it('does not duplicate a word met twice in one lesson', () => {
    const out = mergeWords([], [{ headword: 'sɛtʋ' }, { headword: 'sɛtʋ' }])
    expect(out).toHaveLength(1)
  })
})

describe('recordWritten', () => {
  it('counts a correct spelling', () => {
    const out = recordWritten([word('sɛtʋ')], 'sɛtʋ')
    expect(out[0].writtenCount).toBe(1)
  })

  it('accumulates across attempts', () => {
    const out = recordWritten(recordWritten([word('sɛtʋ')], 'sɛtʋ'), 'sɛtʋ')
    expect(out[0].writtenCount).toBe(2)
  })

  it('adds a word written without having been met in a lesson', () => {
    // Practising straight from a dictionary entry should still count.
    const out = recordWritten([], 'fɛŋgɛ')
    expect(out).toHaveLength(1)
    expect(out[0].writtenCount).toBe(1)
  })

  it('leaves other words alone', () => {
    const out = recordWritten([word('sɛtʋ'), word('alaafɩya', 2)], 'sɛtʋ')
    expect(out.find((w) => w.headword === 'alaafɩya')!.writtenCount).toBe(2)
  })
})
