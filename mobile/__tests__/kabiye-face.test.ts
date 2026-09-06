import { childrenNeedKabiyeFace, needsKabiyeFace } from '../src/utils/kabiye-script'

describe('needsKabiyeFace', () => {
  // The twelve letters measured as absent from Figtree's cmap.
  it.each(['ɖ', 'Ɖ', 'ɛ', 'Ɛ', 'ɣ', 'Ɣ', 'ɩ', 'Ɩ', 'ɔ', 'Ɔ', 'ʋ', 'Ʋ'])(
    'claims %s, which the interface face cannot draw',
    (letter) => {
      expect(needsKabiyeFace(letter)).toBe(true)
    }
  )

  it('leaves ñ and ŋ to the interface face, which draws both', () => {
    expect(needsKabiyeFace('ñɔsɩ')).toBe(true) // ɔ and ɩ still claim it
    expect(needsKabiyeFace('ñ')).toBe(false)
    expect(needsKabiyeFace('naŋ')).toBe(false)
  })

  it('claims a whole sentence that merely mentions one letter', () => {
    expect(needsKabiyeFace('The symbol ɣ marks vowel length.')).toBe(true)
  })

  it('leaves ordinary interface copy alone', () => {
    expect(needsKabiyeFace('Back to Lessons')).toBe(false)
    expect(needsKabiyeFace('Kabiyè Alphabet')).toBe(false) // è is in Figtree
    expect(needsKabiyeFace('')).toBe(false)
  })
})

describe('childrenNeedKabiyeFace', () => {
  it('finds Kabiyè nested in an interpolated child array', () => {
    expect(childrenNeedKabiyeFace(['Plural: ', 'tɔna'])).toBe(true)
    expect(childrenNeedKabiyeFace(['1.1 ', 'animal hide, skin'])).toBe(false)
  })

  it('ignores non-text children rather than guessing', () => {
    expect(childrenNeedKabiyeFace(null)).toBe(false)
    expect(childrenNeedKabiyeFace(undefined)).toBe(false)
    expect(childrenNeedKabiyeFace(42)).toBe(false)
  })
})
