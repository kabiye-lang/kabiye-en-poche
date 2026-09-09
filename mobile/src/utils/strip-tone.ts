/**
 * The orthographic form of a tone-marked word.
 *
 * Kabiyè does not write tone; the conjugation book and the pronunciation fields do.
 * Combining marks are stripped except the tilde: ñ is a letter (n + U+0303), not a
 * tone, and stripping every mark rewrites ñɩɣʋ as nɩɣʋ.
 */
export function stripTone(text: string): string {
  return text.normalize('NFD').replace(/[̀-̂̄̌̍̀́]/gu, '').normalize('NFC')
}
