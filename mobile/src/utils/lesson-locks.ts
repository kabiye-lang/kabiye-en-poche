/**
 * Which lessons in a unit a learner may open.
 *
 * The rule used to be "locked unless the previous lesson is completed". On a flat map
 * that was the path. On the five-level map an unbuilt lesson can sit between two built
 * ones -- "The Eight Letters French Does Not Have" is planned before "Vowel Harmony",
 * which already has content -- and an unbuilt lesson can never be completed, so it
 * locked everything after it forever.
 *
 * A lesson now gates the next one only if it is open (has content a learner can finish).
 * Unbuilt lessons are skipped when looking back for the gate, and are themselves always
 * locked: the Learn screen shows them as "Soon".
 */
export interface LockableLesson {
  id: string
  status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
}

export function isOpen(lesson: LockableLesson): boolean {
  return lesson.status === 'available' || lesson.status === null
}

export function lockStates(lessons: LockableLesson[], completed: Set<string>): boolean[] {
  let gate: string | null = null // the id the learner must have finished to proceed
  return lessons.map((lesson) => {
    if (!isOpen(lesson)) return true
    const locked = gate !== null && !completed.has(gate)
    gate = lesson.id
    return locked
  })
}

export interface PathUnit {
  id: string
  status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
}

/**
 * The one lesson to resume from.
 *
 * Walk the units in the learner's order and return the first open, unlocked lesson they
 * have not finished. It used to be computed in SQL from "the lesson after the last one
 * completed", which knows nothing about the learner's path -- so Home said "continue
 * with the alphabet" while Learn, sorted for a beginner, put greetings first. Both now
 * ask this function with the same ordered units.
 *
 * A unit that is not open contributes nothing: its lessons cannot be opened from Learn,
 * so they cannot be the place to resume either.
 */
export function nextLesson<L extends LockableLesson & { unit_id: string; position: number }>(
  orderedUnits: PathUnit[],
  lessons: L[],
  completed: Set<string>
): L | null {
  for (const unit of orderedUnits) {
    if (unit.status !== 'available' && unit.status !== null) continue
    const inUnit = lessons.filter((lesson) => lesson.unit_id === unit.id).sort((a, b) => a.position - b.position)
    const locks = lockStates(inUnit, completed)
    const found = inUnit.find((lesson, i) => !locks[i] && !completed.has(lesson.id))
    if (found) return found
  }
  return null
}
