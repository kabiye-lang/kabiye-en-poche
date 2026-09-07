import type { ReactNode } from 'react'

/**
 * The twelve letters Kabiyè uses that the interface face does not draw.
 *
 * The interface face covers 4 of the 16 letters in the Kabiyè alphabet, so a word like
 * `ɖoo` or a grapheme like `aɣ` was rendered half in it and half in whatever the OS fell
 * back to -- two typefaces inside one word, on an alphabet card whose whole job is to
 * show the learner what that letter looks like.
 *
 * `ñ` and `ŋ` are deliberately absent from this set: the interface face draws both, so
 * text containing only those still belongs to it.
 *
 * This list survived the Laterite change of interface face unaltered -- Bricolage
 * Grotesque misses precisely the same twelve letters Figtree did. That is luck, not a
 * property of grotesques, so `__tests__/kabiye-font-coverage.test.ts` reads the shipped
 * font binary and fails if the next face moves the line.
 */
const KABIYE_ONLY_LETTERS = /[ɖƉɛƐɣƔɩƖɔƆʋƲ]/

/** True when the string contains a letter the interface face cannot draw. */
export function needsKabiyeFace(value: string): boolean {
  return KABIYE_ONLY_LETTERS.test(value)
}

/**
 * True when any string anywhere in `children` needs the Kabiyè face.
 *
 * React Native applies one font family per Text node, so the decision is made for the
 * whole node: a sentence that mentions `ɣ` is set entirely in Andika rather than
 * splicing faces mid-line. Andika covers Latin fully, so nothing is lost.
 */
export function childrenNeedKabiyeFace(children: ReactNode): boolean {
  if (typeof children === 'string') return needsKabiyeFace(children)
  if (Array.isArray(children)) return children.some(childrenNeedKabiyeFace)
  return false
}
