/**
 * Which letters of the correct spelling differ from what the learner wrote.
 *
 * Split by grapheme, not code point: a base letter (`\P{M}`) followed by zero or more
 * combining marks (`\p{M}`) groups a letter with any marks that follow it, so a missing
 * tone mark is a difference *in* a letter,
 * not a deleted character shifting every one after it. The two are then aligned by longest
 * common subsequence -- the same technique a text diff uses -- so one wrong letter in the
 * middle of the word does not cascade into "everything after it differs" the way a
 * position-by-position comparison would once the strings are out of step.
 */

export interface DiffLetter {
  /** The letter as it appears in the *answer* -- this is always what is rendered. */
  letter: string
  differs: boolean
}

function graphemes(word: string): string[] {
  return word.normalize('NFC').match(/\P{M}\p{M}*/gu) ?? []
}

/**
 * Letters of `answer`, each marked whether it differs from the closest alignment in
 * `written`. Case is folded for the alignment only -- the rendered `letter` keeps the
 * answer's own casing.
 */
export function letterDiff(written: string, answer: string): DiffLetter[] {
  const display = graphemes(answer)
  const a = graphemes(written).map((g) => g.toLocaleLowerCase())
  const b = display.map((g) => g.toLocaleLowerCase())

  const m = a.length
  const n = b.length
  const lengths: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      lengths[i][j] = a[i - 1] === b[j - 1] ? lengths[i - 1][j - 1] + 1 : Math.max(lengths[i - 1][j], lengths[i][j - 1])
    }
  }

  // Backtrack the LCS to find which positions in `b` (the answer) took part in it -- those
  // are the letters that match; everything else differs.
  const matched = new Array<boolean>(n).fill(false)
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matched[j - 1] = true
      i--
      j--
    } else if (lengths[i - 1][j] >= lengths[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return display.map((letter, index) => ({ letter, differs: !matched[index] }))
}
