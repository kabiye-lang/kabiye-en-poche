/**
 * The distractors on a "Spot the letter" step must be the correct word spelled wrongly,
 * never a new word. These tests pin that: everything produced is a substitution of the
 * input, and nothing invents a letter sequence of its own.
 */

import { differingIndices, PLAIN_FOR_KABIYE, specialPositions, spellingVariants } from '../src/utils/kabiye-variants'

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

describe('kabiyeSpellingOf', () => {
  const { kabiyeSpellingOf } = jest.requireActual('../src/utils/kabiye-variants')
  const POOL = ['Kabɩyɛ', 'ɖoo', 'alaafɩya', 'sɛtʋ', 'caa']

  it('finds the Kabiyè spelling of a query typed on a French keyboard', () => {
    expect(kabiyeSpellingOf('kabiye', POOL)).toBe('kabɩyɛ')
  })

  it('prefers the nearest miss', () => {
    expect(kabiyeSpellingOf('setʋ', POOL)).toBe('sɛtʋ')
  })

  it('suggests nothing when the dictionary does not hold the result', () => {
    // This is the whole point: a suggestion is a lookup, never a guess. Proposing a
    // spelling we do not hold would invent a word exactly when the learner would
    // believe it.
    expect(kabiyeSpellingOf('zzzz', POOL)).toBeUndefined()
    expect(kabiyeSpellingOf('bonjour', POOL)).toBeUndefined()
  })

  it('says nothing when the query is already right', () => {
    expect(kabiyeSpellingOf('kabɩyɛ', POOL)).toBeUndefined()
  })

  it('never expands n, because ŋ and ñ cannot be told apart', () => {
    expect(kabiyeSpellingOf('nana', ['ŋaŋa', 'ñaña'])).toBeUndefined()
  })

  it('ignores an empty query', () => {
    expect(kabiyeSpellingOf('   ', POOL)).toBeUndefined()
  })
})
