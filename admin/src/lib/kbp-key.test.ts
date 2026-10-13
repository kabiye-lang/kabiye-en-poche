import { describe, expect, it } from 'vitest'

import { kbpKey } from './kbp-key'

// Shared vectors: the app and the Python pipeline must give the same keys.
describe('kbpKey', () => {
  it.each([
    ['Páná!', 'pana'],
    ['mayáa', 'mayaa'],
    ['  Lɩm  keɖe. ', 'lɩm keɖe'],
    ['Ɛpammʋtʋ', 'ɛpammʋtʋ'],
    ['ñɩnɖʋ', 'ñɩnɖʋ'],
    ['ŋ́', 'ŋ'],
    ["Ɔ̀kɔ́ɔ, -n'áa", 'ɔkɔɔ n aa'],
    ['', ''],
  ])('%j -> %j', (input, expected) => {
    expect(kbpKey(input)).toBe(expected)
  })
})
