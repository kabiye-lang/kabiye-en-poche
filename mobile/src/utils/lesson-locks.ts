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
