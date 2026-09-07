import type { LessonExample } from '../types/lesson-steps'

/**
 * What each content section is for, and where the lesson flow should put it.
 *
 * The Laterite flow is cover → each word taught and practised → finish. Prose sections
 * are not steps in it; the per-word note took their place. But three things the
 * competency-based lessons carry are sections and not prose: a dialogue set in a
 * situation, cultural notes, and the TDA — one sentence to go and do this week. The
 * generator marks them with `kind`; lessons generated before `kind` existed are
 * recognised by the titles the prompt asked for, so they are not shown as paragraphs.
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
  /** Everything else: mined for taught words, never shown as a step. */
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
