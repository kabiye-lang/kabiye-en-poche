// Tone and length marks the match key ignores. U+0303 (tilde) stays so ñ survives.
const IGNORED_MARKS = /[̀́̂̄̌]/g

/**
 * Match key for a Kabiyè text: the app and the Python pipeline compute the same key,
 * so a recording is found for the lesson text that it says, whatever the tone marks.
 */
export function kbpKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(IGNORED_MARKS, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^\p{L}\p{M}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
