import { kbpKey } from '../kbp-key'

// The audio pipeline and the admin share these exact vectors. A key that drifts from
// theirs files a recording where the app never looks for it.
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
