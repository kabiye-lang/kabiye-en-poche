import type { ReactNode } from 'react'

/**
 * The twelve letters Kabiyè uses that Figtree does not draw.
 *
 * Figtree covers 4 of the 16 letters in the Kabiyè alphabet and IBM Plex Sans Hebrew
 * covers 2, so a word like `ɖoo` or a grapheme like `aɣ` was rendered half in Figtree
 * and half in whatever the OS fell back to -- two typefaces inside one word, on an
 * alphabet card whose whole job is to show the learner what that letter looks like.
 *
 * `ñ` and `ŋ` are deliberately absent from this set: Figtree draws both, so text
 * containing only those still belongs to the interface face.
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
