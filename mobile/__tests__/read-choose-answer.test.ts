import { correctIndex } from '../src/utils/activity-answer'

/**
 * `read_choose` shows one list of readings per interface language, but the schema stores
 * `correct_answer` as a single string. Comparing them as strings marks every French
 * answer wrong, because the stored answer is written in English. Matching by position
 * is what makes the step answerable in both languages, and it covers the older rows
 * that store `{en, fr}` without migrating them.
 */
describe('which reading is the right one', () => {
  const options = {
    en: ['greeting and good health', 'good health and good form', 'an educated person'],
    fr: ['salutation et bonne santé', 'bonne santé et bonne forme', 'une personne instruite'],
  }

  it('finds a plain English answer when the interface is French', () => {
    const data = { options, correct_answer: 'greeting and good health' }

    expect(correctIndex(data, 'fr')).toBe(0)
    expect(options.fr[correctIndex(data, 'fr')]).toBe('salutation et bonne santé')
  })

  it('finds a plain answer wherever in the list it sits', () => {
    expect(correctIndex({ options, correct_answer: 'an educated person' }, 'en')).toBe(2)
  })

  it('prefers the interface language when the answer is language-keyed', () => {
    const data = {
      options,
      correct_answer: { en: 'good health and good form', fr: 'bonne santé et bonne forme' },
    }

    expect(correctIndex(data, 'fr')).toBe(1)
    expect(correctIndex(data, 'en')).toBe(1)
  })

  it('falls back to another language when one side is missing', () => {
    const data = { options, correct_answer: { en: 'an educated person' } }

    expect(correctIndex(data, 'fr')).toBe(2)
  })

  it('reports -1 rather than guessing when the answer is in no list', () => {
    expect(correctIndex({ options, correct_answer: 'something else' }, 'en')).toBe(-1)
    expect(correctIndex({ options }, 'en')).toBe(-1)
    expect(correctIndex(undefined, 'en')).toBe(-1)
  })
})
