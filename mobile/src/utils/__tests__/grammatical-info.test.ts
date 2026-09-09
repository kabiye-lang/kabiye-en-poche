import type { Abbreviation, AbbreviationTable } from '../grammatical-info'

import { describeGrammaticalInfo, grammaticalComponents, tokens } from '../grammatical-info'

const row = (code: string, en: string, fr: string, kind = 'pos', detail?: Abbreviation['detail']): Abbreviation => ({
  code,
  kind,
  en,
  fr,
  detail: detail ?? null,
})

// A slice of dictionary_abbreviations, as the app receives it.
const TABLE: AbbreviationTable = new Map(
  [
    row('n', 'noun', 'nom, substantif'),
    row('adv. expr. répét', 'expressive adverb, repeated', 'adverbe expressif répétitif'),
    row('E', 'noun class E: most people and animate beings', 'classe nominale E : la plupart des personnes', 'class', {
      pronoun: 'ɛ-',
      suffix: '-ʋ / -u',
      number: 'singular',
      example: { kbp: 'ɛyʋ', fr: 'personne', en: 'person' },
    }),
    row('pA', 'noun class pA: the plural of people', 'classe nominale pA : pluriel des personnes', 'class', {
      pronoun: 'pa-',
      number: 'plural',
    }),
    row('tI', 'noun class tI: collectives', 'classe nominale tI : collectifs', 'class', { number: 'collective' }),
  ].map((r) => [r.code, r])
)

describe('describeGrammaticalInfo', () => {
  it('reads a noun with its two classes as one sentence', () => {
    expect(describeGrammaticalInfo('n.E, pA', TABLE, 'en')).toBe('noun · class E in the singular, pA in the plural')
    expect(describeGrammaticalInfo('n.E, pA', TABLE, 'fr')).toBe('nom · classe E au singulier, pA au pluriel')
  })

  it('reads a verb code from its pattern and subgroup', () => {
    expect(describeGrammaticalInfo('v.3b', TABLE, 'fr')).toBe('verbe · conjugaison du schéma 3, sous-groupe b')
    expect(describeGrammaticalInfo('v.3', TABLE, 'en')).toBe('verb · conjugation pattern 3')
  })

  it('names a single class with its number and looks other codes up', () => {
    expect(describeGrammaticalInfo('n.tI', TABLE, 'en')).toBe('noun · class tI (collective)')
    expect(describeGrammaticalInfo('adv. expr. répét.', TABLE, 'en')).toBe('expressive adverb, repeated')
  })

  it('shows a code the table does not know as written, and nothing for nothing', () => {
    expect(describeGrammaticalInfo('nom propre', TABLE, 'en')).toBe('nom propre')
    expect(describeGrammaticalInfo('', TABLE, 'en')).toBeNull()
    expect(describeGrammaticalInfo(undefined, TABLE, 'en')).toBeNull()
  })

  it('reads either-class values on both sides', () => {
    expect(describeGrammaticalInfo('pA ou n.E', TABLE, 'en')).toBe('class pA (plural) or noun · class E (singular)')
  })
})

describe('grammaticalComponents', () => {
  it('lists the noun, then each class with its facts', () => {
    const parts = grammaticalComponents('n.E, pA', TABLE, 'en')
    expect(parts.map((p) => p.code)).toEqual(['n', 'E', 'pA'])
    expect(parts[1].detail?.example?.kbp).toBe('ɛyʋ')
    expect(parts[1].meaning).toMatch(/noun class E/)
  })

  it('splits on commas and drops a trailing period and a bracketed note', () => {
    expect(tokens('n.kI, I.')).toEqual(['n.kI', 'I'])
    expect(tokens("n.E, pA (viendrait d'angl. payer)")).toEqual(['n.E', 'pA'])
  })
})
