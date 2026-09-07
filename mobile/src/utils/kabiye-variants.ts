/**
 * Plain-Latin misspellings of a Kabiyè word, derived rather than invented.
 *
 * "Spot the letter" asks the learner to pick the right spelling out of three. The wrong
 * two cannot be authored by hand or by a model: a plausible-looking Kabiyè word that no
 * source attests is exactly the defect the whole pipeline exists to prevent, and it is
 * worse here than anywhere else, because the screen presents all three spellings as
 * candidates and the learner is being taught which shapes are real.
 *
 * So the distractors are a mechanical transformation of the correct headword: take the
 * letters French cannot write and substitute the plain letter a French keyboard would
 * reach for. Every distractor is therefore the specific mistake this learner is about to
 * make, and no new Kabiyè is created -- only the correct word, spelled wrongly.
 */

/**
 * What a French keyboard reaches for instead of each Kabiyè letter.
 *
 * `ŋ` and `ñ` both fall to `n`; the map is deliberately one-way. Going the other
 * direction would have to guess which of the two an `n` meant, and guessing a spelling
 * is inventing Kabiyè from the other end.
 */
export const PLAIN_FOR_KABIYE: Readonly<Record<string, string>> = {
  ɖ: 'd',
  Ɖ: 'D',
  ɛ: 'e',
  Ɛ: 'E',
  ɣ: 'g',
  Ɣ: 'G',
  ɩ: 'i',
  Ɩ: 'I',
  ŋ: 'n',
  Ŋ: 'N',
  ɔ: 'o',
  Ɔ: 'O',
  ʋ: 'u',
  Ʋ: 'U',
  ñ: 'n',
  Ñ: 'N',
}

/** Positions in `word` holding a letter French cannot write. */
export function specialPositions(word: string): number[] {
  const out: number[] = []
  for (const [i, ch] of [...word].entries()) if (ch in PLAIN_FOR_KABIYE) out.push(i)
  return out
}

function substitute(word: string, positions: Iterable<number>): string {
  const chars = [...word]
  for (const i of positions) chars[i] = PLAIN_FOR_KABIYE[chars[i]] ?? chars[i]
  return chars.join('')
}

export interface SpellingVariant {
  /** The misspelling. */
  text: string
  /** Indices, into the *correct* word, of the letters this variant got wrong. */
  swapped: number[]
}

/**
 * Every distinct plain-letter misspelling of `word`, fewest mistakes first.
 *
 * A word with n special letters has 2^n - 1 of them, so this is capped: `limit` stops
 * the enumeration, and words are short enough that the cap is rarely reached. Ordering
 * fewest-first means a caller taking the first two gets the near misses -- the spellings
 * that are actually hard to tell apart -- rather than two words mangled beyond use.
 */
export function spellingVariants(word: string, limit = 8): SpellingVariant[] {
  const positions = specialPositions(word)
  if (positions.length === 0) return []

  const out: SpellingVariant[] = []
  const seen = new Set<string>([word])

  // Subsets in order of size, so one-letter mistakes come before two.
  for (let size = 1; size <= positions.length && out.length < limit; size++) {
    for (const subset of combinations(positions, size)) {
      const text = substitute(word, subset)
      if (seen.has(text)) continue // ŋ and ñ both fall to n, so subsets can collide
      seen.add(text)
      out.push({ text, swapped: subset })
      if (out.length >= limit) break
    }
  }
  return out
}

function* combinations(items: number[], size: number): Generator<number[]> {
  if (size === 0) {
    yield []
    return
  }
  for (let i = 0; i <= items.length - size; i++) {
    for (const rest of combinations(items.slice(i + 1), size - 1)) {
      yield [items[i], ...rest]
    }
  }
}

/** Indices where two equal-length strings differ. Used to highlight the letter in question. */
export function differingIndices(a: string, b: string): number[] {
  const left = [...a]
  const right = [...b]
  const out: number[] = []
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    if (left[i] !== right[i]) out.push(i)
  }
  return out
}
