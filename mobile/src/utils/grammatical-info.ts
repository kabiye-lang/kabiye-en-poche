/**
 * What `n.E, pA` means, in words.
 *
 * The dictionary writes a word's grammatical class in the SIL notation: `n.` for a noun
 * followed by its noun class in the singular and the plural, `v.3b` for a verb on
 * conjugation pattern 3 subgroup b, `adv. expr.` for an expressive adverb. The pipeline
 * normalises both sources to one written form (kbp-dict-crawler,
 * scripts/lexicon/abbreviations.py) and loads every code with its meaning into
 * `dictionary_abbreviations`; this file turns a code into the sentence the entry screen
 * shows under it, and into the list the info button expands. A learner who has never
 * heard of a noun class should not have to decode `pA` from a tooltip.
 */

export interface Abbreviation {
  code: string
  kind: string
  fr: string
  en: string
  detail?: {
    pronoun?: string
    suffix?: string
    certain?: string
    this?: string
    number?: 'singular' | 'plural' | 'collective' | 'mass'
    example?: { kbp: string; fr: string; en: string }
  } | null
}

export type AbbreviationTable = Map<string, Abbreviation>
export type Lang = 'en' | 'fr'

const CLASS_CODE = /^(?:n\.)?(kI|kA|sI|ɖI|tI|pI|pA|E|I|a)$/u
const CLASSE = /^classe (kI|kA|sI|ɖI|tI|pI|pA|E|I|a)$/u
const VERB_CODE = /^v\.([1-6])([a-hn]?)$/u

const NUMBER: Record<string, [string, string]> = {
  singular: ['singulier', 'singular'],
  plural: ['pluriel', 'plural'],
  collective: ['collectif', 'collective'],
  mass: ['masse', 'mass'],
}

export function tokens(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .replace(/\s*\(.*$/u, '')
    .split(/\s*[,;]\s*/u)
    .map((t) => t.trim().replace(/\.$/u, ''))
    .filter(Boolean)
}

function classPhrase(cls: string, table: AbbreviationTable, lang: Lang): string {
  const number = table.get(cls)?.detail?.number
  const n = number ? NUMBER[number] : undefined
  const num = n ? ` (${lang === 'fr' ? n[0] : n[1]})` : ''
  return lang === 'fr' ? `classe ${cls}${num}` : `class ${cls}${num}`
}

/**
 * One sentence: `n.E, pA` -> "noun · class E in the singular, pA in the plural".
 * A code the table does not know is shown as written rather than dropped.
 */
export function describeGrammaticalInfo(
  value: string | null | undefined,
  table: AbbreviationTable,
  lang: Lang
): string | null {
  const parts: string[] = []
  const classes: string[] = []
  const list = tokens(value)
  if (list.length === 0) return null
  for (const t of list) {
    if (t.includes(' ou ')) {
      const either = lang === 'fr' ? ' ou ' : ' or '
      parts.push(
        t
          .split(' ou ')
          .map((side) => describeGrammaticalInfo(side, table, lang) ?? side)
          .join(either)
      )
      continue
    }
    const cls = CLASS_CODE.exec(t) ?? CLASSE.exec(t)
    if (cls) {
      const noun = lang === 'fr' ? 'nom' : 'noun'
      if (t.startsWith('n.') && !parts.includes(noun)) parts.push(noun)
      classes.push(cls[1])
      continue
    }
    const verb = VERB_CODE.exec(t)
    if (verb) {
      const sub = verb[2]
      parts.push(
        lang === 'fr'
          ? `verbe · conjugaison du schéma ${verb[1]}${sub ? `, sous-groupe ${sub}` : ''}`
          : `verb · conjugation pattern ${verb[1]}${sub ? `, subgroup ${sub}` : ''}`
      )
      continue
    }
    const known = table.get(t)
    parts.push(known ? (lang === 'fr' ? known.fr : known.en) : t)
  }
  if (
    classes.length === 2 &&
    table.get(classes[0])?.detail?.number === 'singular' &&
    table.get(classes[1])?.detail?.number === 'plural'
  ) {
    parts.push(
      lang === 'fr'
        ? `classe ${classes[0]} au singulier, ${classes[1]} au pluriel`
        : `class ${classes[0]} in the singular, ${classes[1]} in the plural`
    )
  } else if (classes.length > 0) {
    parts.push(classes.map((c) => classPhrase(c, table, lang)).join(' ; '))
  }
  return parts.join(' · ')
}

export interface Component {
  code: string
  kind: string
  meaning: string
  /** Classes only: the facts a learner can hold on to. */
  detail?: Abbreviation['detail']
}

/** Each code in a value with its meaning -- what the info panel lists. */
export function grammaticalComponents(
  value: string | null | undefined,
  table: AbbreviationTable,
  lang: Lang
): Component[] {
  const out: Component[] = []
  for (const t of tokens(value)) {
    if (t.includes(' ou ')) {
      for (const side of t.split(' ou ')) out.push(...grammaticalComponents(side, table, lang))
      continue
    }
    const cls = CLASS_CODE.exec(t) ?? CLASSE.exec(t)
    if (cls) {
      if (t.startsWith('n.') && !out.some((o) => o.code === 'n')) {
        const n = table.get('n')
        out.push({
          code: 'n',
          kind: 'pos',
          meaning: n ? (lang === 'fr' ? n.fr : n.en) : lang === 'fr' ? 'nom' : 'noun',
        })
      }
      const row = table.get(cls[1])
      out.push({
        code: cls[1],
        kind: 'class',
        meaning: row ? (lang === 'fr' ? row.fr : row.en) : classPhrase(cls[1], table, lang),
        detail: row?.detail ?? null,
      })
      continue
    }
    if (VERB_CODE.test(t)) {
      out.push({ code: t, kind: 'verb', meaning: describeGrammaticalInfo(t, table, lang) ?? t })
      continue
    }
    const row = table.get(t)
    out.push({ code: t, kind: row?.kind ?? 'other', meaning: row ? (lang === 'fr' ? row.fr : row.en) : t })
  }
  return out
}
