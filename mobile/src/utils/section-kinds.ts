import type { LessonExample } from '../types/lesson-steps'

/**
 * What each content section is for, and where the lesson flow should put it.
 *
 * The Laterite flow is cover → each word taught and practised → finish. For a while the
 * prose sections were not steps in it at all — the per-word note had taken their place —
 * which left the one thing a grammar lesson exists for, the rule, written and paid for
 * and never shown: "ɛlɛ goes between commas" lived in `content_en` and no screen read it.
 * A prose section is now a short rule step after the words it teaches, with the
 * sentences that use them (`sectionSentences`). Three other things the competency-based
 * lessons carry are sections and not prose: a dialogue set in a situation, cultural
 * notes, and the TDA — one sentence to go and do this week. The generator marks them
 * with `kind`; lessons generated before `kind` existed are recognised by the titles the
 * prompt asked for.
 */
export type SectionKind = 'prose' | 'dialogue' | 'cultural_notes' | 'tda'

export interface SectionLike {
  kind?: string | null
  title_en?: string | null
  title_fr?: string | null
  content_en?: string | null
  content_fr?: string | null
  examples?: unknown
}

export function sectionKind(section: SectionLike): SectionKind {
  const k = section.kind
  if (k === 'prose' || k === 'dialogue' || k === 'cultural_notes' || k === 'tda') return k
  const title = `${section.title_en ?? ''} ${section.title_fr ?? ''}`.toLowerCase()
  if (title.includes('dialogue')) return 'dialogue'
  if (title.includes('cultural') || title.includes('culturel')) return 'cultural_notes'
  if (title.includes('this week') || title.includes('cette semaine') || title.includes('to do')) return 'tda'
  return 'prose'
}

export interface PlacedSections<S extends SectionLike> {
  /** Opens the lesson, right after the cover. */
  dialogue?: S
  /** Sits before the finish. */
  notes?: S
  /** Shown on the finish screen. */
  tda?: S
  /** Everything else: mined for taught words, then shown as a rule step after them. */
  prose: S[]
}

export function placeSections<S extends SectionLike>(sections: S[]): PlacedSections<S> {
  const out: PlacedSections<S> = { prose: [] }
  for (const s of sections) {
    const kind = sectionKind(s)
    if (kind === 'dialogue' && !out.dialogue) out.dialogue = s
    else if (kind === 'cultural_notes' && !out.notes) out.notes = s
    else if (kind === 'tda' && !out.tda) out.tda = s
    else out.prose.push(s)
  }
  return out
}

/** A dialogue's turns are its examples, in order. A turn with no Kabiyè is not a turn. */
export function dialogueTurns(section: SectionLike): LessonExample[] {
  const raw = Array.isArray(section.examples) ? (section.examples as LessonExample[]) : []
  return raw.filter((e) => typeof e?.kbp === 'string' && e.kbp.trim().length > 0)
}

const MAX_SECTION_SENTENCES = 4

/** A verb is listed as its infinitive and said without the -ʋ/-ʋʋ: `kɛʋ` is `kɛ` in a sentence. */
function stem(word: string): string {
  return word.replace(/[ʋu]+$/u, '') || word
}

function uses(sentence: string, words: string[]): boolean {
  const tokens = sentence
    .toLowerCase()
    .split(/[^\p{L}\p{M}'’-]+/u)
    .filter(Boolean)
  return words.some((word) => {
    const s = stem(word)
    return tokens.some(
      (token) => token === word || (s.length >= 2 && token.startsWith(s) && token.length - s.length <= 3)
    )
  })
}

/**
 * The sentences a prose section shows under its rule: the ones that use one of the
 * words the section taught, a few at most. The generator now trims the rest before a
 * lesson is saved; lessons written before it did carry a third of their sentences in
 * the wrong section ("The school is clean" under "tɛɛ and wayɩ"), so the filter runs
 * here too. A section that taught no word shows its first few sentences as they are.
 */
export function sectionSentences(section: SectionLike, taught: string[]): LessonExample[] {
  const raw = Array.isArray(section.examples) ? (section.examples as LessonExample[]) : []
  const sentences = raw.filter((e) => typeof e?.kbp === 'string' && e.kbp.trim().includes(' '))
  const words = taught.map((w) => w.toLowerCase())
  const kept = words.length > 0 ? sentences.filter((e) => uses(e.kbp, words)) : sentences
  return kept.slice(0, MAX_SECTION_SENTENCES)
}
