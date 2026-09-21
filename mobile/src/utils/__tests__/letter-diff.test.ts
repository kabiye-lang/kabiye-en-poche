import { letterDiff } from '../letter-diff'

describe('letterDiff', () => {
  it('marks nothing when the words are identical', () => {
    expect(letterDiff('kɛlɩm', 'kɛlɩm')).toEqual([
      { letter: 'k', differs: false },
      { letter: 'ɛ', differs: false },
      { letter: 'l', differs: false },
      { letter: 'ɩ', differs: false },
      { letter: 'm', differs: false },
    ])
  })

  it('treats a base letter and a combining mark as one grapheme -- a missing tone mark differs there, not after it', () => {
    // 'ɛ' (U+025B) has no precomposed accented form, so NFC leaves 'ɛ' plus a combining
    // acute (U+0301) as two codepoints -- exactly the case the grapheme split exists for.
    const written = 'wɛ' // "w" + "ɛ", no mark
    const answer = 'wɛ́' // "w" + "ɛ" with a combining acute on the ɛ
    expect(letterDiff(written, answer)).toEqual([
      { letter: 'w', differs: false },
      { letter: 'ɛ́', differs: true }, // one grapheme: base letter plus its mark
    ])
  })

  it('flags ɖ as differing from d, keeping the rest aligned', () => {
    expect(letterDiff('dɛ', 'ɖɛ')).toEqual([
      { letter: 'ɖ', differs: true },
      { letter: 'ɛ', differs: false },
    ])
  })

  it('a missing trailing letter differs only there, not for the whole word', () => {
    expect(letterDiff('kɛlɩ', 'kɛlɩm')).toEqual([
      { letter: 'k', differs: false },
      { letter: 'ɛ', differs: false },
      { letter: 'l', differs: false },
      { letter: 'ɩ', differs: false },
      { letter: 'm', differs: true },
    ])
  })

  it('keeps the answer own casing while aligning case-insensitively', () => {
    expect(letterDiff('KƐLƖM', 'kɛlɩm')).toEqual([
      { letter: 'k', differs: false },
      { letter: 'ɛ', differs: false },
      { letter: 'l', differs: false },
      { letter: 'ɩ', differs: false },
      { letter: 'm', differs: false },
    ])
  })
})
