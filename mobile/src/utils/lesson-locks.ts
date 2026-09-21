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
import { isWritten } from './lesson-status'

export interface LockableLesson {
  id: string
  status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
}

export function isOpen(lesson: LockableLesson): boolean {
  return isWritten(lesson.status)
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

export interface NextLessonResult<L, U> {
  lesson: L
  /** The unit the lesson belongs to, in the ordering it was found under. */
  unit: U
  /** The lesson's 1-based position among the written lessons of its unit. */
  ordinal: number
  /** How many written lessons that unit holds. */
  writtenInUnit: number
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
 * so they cannot be the place to resume either. Alongside the lesson, this returns where
 * it sits among the unit's written lessons -- "Lesson 3 of 8" -- so a caller with no
 * saved session can still say something concrete.
 */
export function nextLesson<U extends PathUnit, L extends LockableLesson & { unit_id: string; position: number }>(
  orderedUnits: U[],
  lessons: L[],
  completed: Set<string>
): NextLessonResult<L, U> | null {
  for (const unit of orderedUnits) {
    if (unit.status !== 'available' && unit.status !== null) continue
    const inUnit = lessons.filter((lesson) => lesson.unit_id === unit.id).sort((a, b) => a.position - b.position)
    const locks = lockStates(inUnit, completed)
    const foundIndex = inUnit.findIndex((lesson, i) => !locks[i] && !completed.has(lesson.id))
    if (foundIndex === -1) continue

    const written = inUnit.filter(isOpen)
    const found = inUnit[foundIndex]
    const ordinal = written.findIndex((lesson) => lesson.id === found.id) + 1
    return { lesson: found, unit, ordinal, writtenInUnit: written.length }
  }
  return null
}
