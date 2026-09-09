import { resolveTranslation } from '../dictionary-helpers'

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
