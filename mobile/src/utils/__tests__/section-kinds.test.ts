import { dialogueTurns, placeSections, sectionKind, sectionSentences } from '../section-kinds'

describe('sectionKind', () => {
  it('trusts the kind the generator set', () => {
    expect(sectionKind({ kind: 'dialogue', title_en: 'Anything' })).toBe('dialogue')
    expect(sectionKind({ kind: 'tda' })).toBe('tda')
  })
  it('falls back to the title for lessons generated before kind existed', () => {
    expect(sectionKind({ title_en: 'Dialogue: at the post office' })).toBe('dialogue')
    expect(sectionKind({ title_en: 'Notes culturelles', title_fr: '' })).toBe('cultural_notes')
    expect(sectionKind({ title_en: 'To do this week' })).toBe('tda')
    expect(sectionKind({ title_en: 'nɛ: putting two things together' })).toBe('prose')
  })
})

describe('placeSections', () => {
  it('routes each kind to its place and keeps prose for mining', () => {
    const out = placeSections([
      { kind: 'prose', title_en: 'A' },
      { kind: 'dialogue', title_en: 'D' },
      { kind: 'prose', title_en: 'B' },
      { kind: 'cultural_notes', title_en: 'N' },
      { kind: 'tda', title_en: 'T' },
    ])
    expect(out.dialogue?.title_en).toBe('D')
    expect(out.notes?.title_en).toBe('N')
    expect(out.tda?.title_en).toBe('T')
    expect(out.prose.map((s) => s.title_en)).toEqual(['A', 'B'])
  })
  it('a second dialogue is treated as prose rather than dropped', () => {
    const out = placeSections([
      { kind: 'dialogue', title_en: 'D1' },
      { kind: 'dialogue', title_en: 'D2' },
    ])
    expect(out.dialogue?.title_en).toBe('D1')
    expect(out.prose.map((s) => s.title_en)).toEqual(['D2'])
  })
})

describe('dialogueTurns', () => {
  it('keeps only examples with Kabiyè', () => {
    const turns = dialogueTurns({ examples: [{ kbp: 'Ɖoɖoo', en: 'Good morning' }, { kbp: '', en: 'x' }, null] })
    expect(turns.map((t) => t.kbp)).toEqual(['Ɖoɖoo'])
  })
})

describe('sectionSentences', () => {
  const ex = (kbp: string) => ({ kbp, en: '', fr: '', pronunciation: '', lexeme_id: kbp })
  const section = {
    kind: 'prose',
    examples: [
      ex('tɛɛ'),
      ex('Nakaa wɛ tɩʋ tɛɛ.'), // uses tɛɛ
      ex('Sukuli wɛ cɩɖɩ cɩɖɩ.'), // the clean school: not this section's
      ex('Nakaa kɛ halʋ.'), // kɛʋ, conjugated
      ex('Ɛwɛ ɖɩɣa wayɩ.'),
    ],
  }

  it('keeps only the sentences that use one of the words the section taught', () => {
    expect(sectionSentences(section, ['tɛɛ', 'kɛʋ']).map((e) => e.kbp)).toEqual(['Nakaa wɛ tɩʋ tɛɛ.', 'Nakaa kɛ halʋ.'])
  })

  it('single words are not sentences', () => {
    expect(sectionSentences(section, ['tɛɛ']).some((e) => e.kbp === 'tɛɛ')).toBe(false)
  })

  it('a section that taught no word shows its first sentences as they are, a few at most', () => {
    expect(sectionSentences(section, []).length).toBe(4)
  })
})
