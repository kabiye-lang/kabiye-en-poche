import { stripTone } from '../strip-tone'

describe('stripTone', () => {
  it('removes tone marks and keeps the letters', () => {
    expect(stripTone('ɛkpákɩ́ɣ́')).toBe('ɛkpakɩɣ')
    expect(stripTone('ɛ́cɛ́lɩ́')).toBe('ɛcɛlɩ')
    expect(stripTone('ɛkáɣ kpaɣ́ʋ')).toBe('ɛkaɣ kpaɣʋ')
  })

  it('ñ is a letter, not a tone: the tilde stays', () => {
    expect(stripTone('ñɩ́ɣʋ')).toBe('ñɩɣʋ')
    expect(stripTone('ñ')).toBe('ñ')
  })

  it('leaves an untoned form alone', () => {
    expect(stripTone('wolo')).toBe('wolo')
  })
})
