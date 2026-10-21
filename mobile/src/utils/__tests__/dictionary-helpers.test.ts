import { entryHref, lexemeHref, orderHomographs, resolveTranslation } from '../dictionary-helpers'

describe('resolveTranslation', () => {
  it("shows the dictionary's own gloss in the reader's language with nothing to say", () => {
    expect(resolveTranslation({ fr: 'étranger', en: 'stranger' }, 'en')).toEqual({
      text: 'stranger',
      language: 'en',
      isFallback: false,
      isMachine: false,
      original: undefined,
    })
  })

  it('falls back to the other language, and says so', () => {
    const out = resolveTranslation({ fr: 'tant pis', en: '' }, 'en')
    expect(out).toMatchObject({ text: 'tant pis', language: 'fr', isFallback: true, isMachine: false })
  })

  it('marks a machine translation and keeps the original within reach', () => {
    const out = resolveTranslation({ fr: 'tant pis', en: 'too bad' }, 'en', '', ['en'])
    expect(out).toMatchObject({ text: 'too bad', language: 'en', isFallback: false, isMachine: true })
    expect(out.original).toEqual({ text: 'tant pis', language: 'fr' })
  })

  it('the other direction: a French reader of a workbook gloss', () => {
    const out = resolveTranslation({ fr: 'bonjour', en: 'good morning' }, 'fr', '', ['fr'])
    expect(out.isMachine).toBe(true)
    expect(out.original).toEqual({ text: 'good morning', language: 'en' })
  })

  it('a machine flag on the side not being read changes nothing', () => {
    const out = resolveTranslation({ fr: 'tant pis', en: 'too bad' }, 'fr', '', ['en'])
    expect(out).toMatchObject({ text: 'tant pis', isMachine: false })
  })

  it('uses the fallback text when there is nothing at all', () => {
    expect(resolveTranslation(null, 'en', 'raw')).toEqual({ text: 'raw', isFallback: false, isMachine: false })
    expect(resolveTranslation({ fr: '', en: '' }, 'en', 'raw').text).toBe('raw')
  })
})

describe('entryHref', () => {
  // get_entry_by_term reads only a trailing subscript as the homograph. A bare headword
  // opens homograph 1, so every `abaa` row opened the interjection.
  it('names the homograph the way get_entry_by_term reads it', () => {
    expect(entryHref({ headword: 'abaa', homograph_number: 2 })).toBe(`/word/${encodeURIComponent('abaa₂')}`)
    expect(entryHref({ headword: 'kaɣ', homograph_number: 12 })).toBe(`/word/${encodeURIComponent('kaɣ₁₂')}`)
    expect(entryHref({ headword: 'aalayɩ tɛm', homograph_number: null })).toBe(
      `/word/${encodeURIComponent('aalayɩ tɛm')}`
    )
  })
  // A lesson example's `kbp` is often a sentence. The lexeme id names the entry.
  it('opens the entry a lexeme id names', () => {
    expect(lexemeHref('abaa#2')).toBe(entryHref({ headword: 'abaa', homograph_number: 2 }))
    expect(lexemeHref('aalayɩ tɛm')).toBe(entryHref({ headword: 'aalayɩ tɛm', homograph_number: null }))
  })
})

describe('orderHomographs', () => {
  // search_dictionary ties two homographs on every sort key, so abaa₂ came back first.
  it('puts tied homographs in number order and leaves other rows alone', () => {
    const row = (headword: string, rank: number, n: number | null) => ({
      headword,
      rank,
      entry_data: { homograph_number: n },
    })
    const rows = [row('abaa', 1.2, 2), row('abaa', 1.2, 1), row('aba', 0.9, null), row('abaa', 0.5, 3)]
    expect(orderHomographs(rows).map((r) => [r.headword, r.entry_data.homograph_number])).toEqual([
      ['abaa', 1],
      ['abaa', 2],
      ['aba', null],
      ['abaa', 3],
    ])
  })
})
