/**
 * The distractors on a "Spot the letter" step must be the correct word spelled wrongly,
 * never a new word. These tests pin that: everything produced is a substitution of the
 * input, and nothing invents a letter sequence of its own.
 */

import {
  differingIndices,
  PLAIN_FOR_KABIYE,
  spellingVariants,
  specialPositions,
} from '../src/utils/kabiye-variants'

describe('spellingVariants', () => {
  it('produces the handoff example for Kabɩyɛ, near misses first', () => {
    const variants = spellingVariants('Kabɩyɛ')
    expect(variants.map((v) => v.text)).toEqual(['Kabiyɛ', 'Kabɩye', 'Kabiye'])
  })

  it('marks which letters each variant got wrong', () => {
    const [first] = spellingVariants('Kabɩyɛ')
    expect(first.text).toBe('Kabiyɛ')
    expect(first.swapped).toEqual([3])
  })

  it('returns nothing for a word French can already write', () => {
    expect(spellingVariants('caa')).toEqual([])
  })

  it('never returns the correct spelling among the distractors', () => {
    for (const word of ['Kabɩyɛ', 'ɖoo', 'ŋgʋ', 'alaafɩya', 'Ɛsɔɔlaa']) {
      expect(spellingVariants(word).map((v) => v.text)).not.toContain(word)
    }
  })

  it('only ever substitutes: every variant keeps the length and the plain letters', () => {
    const word = 'Ɛsɔɔlaa'
    for (const { text } of spellingVariants(word)) {
      expect([...text]).toHaveLength([...word].length)
      for (const [i, ch] of [...text].entries()) {
        const original = [...word][i]
        // each position is either untouched, or the documented plain form of the original
        expect(ch === original || ch === PLAIN_FOR_KABIYE[original]).toBe(true)
      }
    }
  })

  it('deduplicates when two different letters fall to the same plain one', () => {
    // ŋ and ñ both become n, so the both-swapped subset can collide with a single swap
    const texts = spellingVariants('ŋañ').map((v) => v.text)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it('honours the limit', () => {
    expect(spellingVariants('ɛɔʋɩɖ', 3)).toHaveLength(3)
  })
})

describe('specialPositions', () => {
  it('finds the letters French cannot write', () => {
    expect(specialPositions('Kabɩyɛ')).toEqual([3, 5])
  })

  it('treats ñ as a Kabiyè letter, not a decorated n', () => {
    expect(specialPositions('añɔka')).toEqual([1, 2])
  })
})

describe('differingIndices', () => {
  it('reports the positions that differ', () => {
    expect(differingIndices('Kabɩyɛ', 'Kabiye')).toEqual([3, 5])
  })

  it('is empty for identical strings', () => {
    expect(differingIndices('ɖoo', 'ɖoo')).toEqual([])
  })
})
