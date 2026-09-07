/**
 * Which option is the right one, as an index into the list being shown.
 *
 * An activity's options can be a list per interface language (`{en: [...], fr: [...]}`)
 * while `correct_answer` is a single string, because the generator's schema cannot
 * afford a language-keyed answer -- see `scripts/lessons/schema.py`. Comparing them as
 * strings marks every French answer wrong: the options on screen are French and the
 * stored answer is English.
 *
 * Matching by position fixes that, and it covers the older rows that store
 * `{en, fr}` without migrating them.
 *
 * Returns -1 when the stored answer appears in no list. That is a content defect rather
 * than a wrong answer, so callers should mark nothing correct rather than guess.
 */
export function correctIndex(
  data: { options?: Record<string, string[] | undefined>; correct_answer?: unknown } | null | undefined,
  language: string
): number {
  const answer = data?.correct_answer
  const lists = data?.options ?? {}

  // A language-keyed answer is authoritative for its own language first.
  if (answer && typeof answer === 'object') {
    const byLanguage = answer as Record<string, string | undefined>
    for (const key of [language, 'en', 'fr', 'kbp']) {
      const wanted = byLanguage[key]
      const index = wanted ? (lists[key] ?? []).indexOf(wanted) : -1
      if (index >= 0) return index
    }
    return -1
  }

  if (typeof answer !== 'string' || !answer) return -1
  for (const list of Object.values(lists)) {
    const index = (list ?? []).indexOf(answer)
    if (index >= 0) return index
  }
  return -1
}
