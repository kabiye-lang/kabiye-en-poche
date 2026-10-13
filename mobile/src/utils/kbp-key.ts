/**
 * The key a recording is filed under: a Kabiyè spelling with tone, case and punctuation
 * taken out, so `Páná!` on a lesson card finds the recording of `pana`.
 *
 * The audio pipeline and the admin compute the same key with the same steps and share
 * one set of test vectors. Change it in all three places or not at all.
 *
 * Only the five tone marks go (grave, acute, circumflex, macron, caron). The tilde stays:
 * ñ is a letter (n + U+0303), not a tone. This is narrower than `stripTone`, which also
 * drops U+030D -- the key follows the shared spec, not that helper.
 */
const TONE_MARKS = /[̀́̂̄̌]/gu
const NOT_LETTER_OR_MARK = /[^\p{L}\p{M}]+/gu

export function kbpKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(TONE_MARKS, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(NOT_LETTER_OR_MARK, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
