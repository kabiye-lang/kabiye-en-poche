import type { LessonStep } from '../types/lesson-steps'

import { hasActivity } from '../types/lesson-steps'

/**
 * Step types the learner can get wrong.
 *
 * Content and completion are not answerable, so they are neither scored nor re-queued.
 * The list was spelled out twice before -- once for scoring and once for the question
 * count -- and the two had already drifted apart.
 */
export const INTERACTIVE_STEPS = new Set<LessonStep['type']>([
  'listen_choose',
  'listen_type',
  'match_pairs',
  'order_words',
  'fill_blank',
  'multiple_choice',
  'true_false',
  'spell',
  'spot_letter',
  'read_choose',
])

export const isInteractive = (step: LessonStep): boolean => INTERACTIVE_STEPS.has(step.type)

/**
 * The taught words this lesson's learner actually tried, distinct, in the order the
 * lesson teaches them.
 *
 * A word counts only through the activity explicitly paired to it -- `wordKbp`, set by
 * `lesson.tsx`'s `teach()` when it finds a matching activity, never by an interactive
 * step simply sitting near a word. A step counts whether the answer landed under its own
 * id or, after a miss, under `retry-{id}`; either way the word is counted once.
 *
 * Lessons generated before pairing existed carry activities with no `wordKbp` at all, so
 * they produce no practised words here -- every word they taught is "met", which is the
 * honest thing to say about content nothing ever explicitly paired.
 */
export function practisedWords(steps: readonly LessonStep[], answers: ReadonlyMap<string, unknown>): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const step of steps) {
    if (!isInteractive(step) || !hasActivity(step)) continue
    const kbp = step.wordKbp
    if (!kbp || seen.has(kbp)) continue
    if (!answers.has(step.id) && !answers.has(`retry-${step.id}`)) continue
    seen.add(kbp)
    out.push(kbp)
  }

  return out
}
