import { isWritten } from './lesson-status'

type Status = 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null

export interface LearnPathUnit {
  id: string
  /** Resolved for the current language by the caller -- this function does no i18n. */
  title: string
  status: Status
}

export interface LearnPathLesson {
  id: string
  unit_id: string
  position: number
  status: Status
}

export interface LearnPathPartition<U extends LearnPathUnit, L extends LearnPathLesson> {
  /** Units that have at least one listed lesson, in path order. */
  units: { unit: U; lessons: L[] }[]
  coming: {
    /** Not-yet-written lessons across the whole path. */
    count: number
    /** Distinct titles of units with nothing listed yet but something coming, in path
     *  order. A unit already shown above is not named again -- its unwritten lessons only
     *  add to `count` -- or the block would call units the learner can open "coming". */
    unitTitles: string[]
  }
}

/** A lesson shown in its unit: written (available/null), or maintenance -- listed but
 *  not pressable, with its own "Being corrected" row. `coming_soon` and `disabled` are
 *  never listed: the former is only counted, in the trailing block; the latter is not
 *  shown anywhere. */
function isListed(status: Status): boolean {
  return isWritten(status) || status === 'maintenance'
}

/**
 * Splits the learner's path into the units worth showing and the lessons still being
 * written, so Learn can render both in one pass instead of a per-unit "Soon" pill that
 * said nothing about how much was coming or where.
 */
export function partitionLearnPath<U extends LearnPathUnit, L extends LearnPathLesson>(
  orderedUnits: U[],
  lessons: L[]
): LearnPathPartition<U, L> {
  const units: { unit: U; lessons: L[] }[] = []
  const comingTitles: string[] = []
  const seenComingUnitIds = new Set<string>()
  let comingCount = 0

  for (const unit of orderedUnits) {
    const inUnit = lessons.filter((lesson) => lesson.unit_id === unit.id).sort((a, b) => a.position - b.position)

    // The unit's own status gates its lessons, as the per-unit pill used to: an admin can
    // pull a whole unit (maintenance, disabled) while its lessons still say "available",
    // and those must not reappear here as open rows. A unit marked coming_soon lists
    // nothing and counts everything it holds as coming.
    if (unit.status === 'maintenance' || unit.status === 'disabled') continue
    const unitIsComing = unit.status === 'coming_soon'

    const listed = unitIsComing ? [] : inUnit.filter((lesson) => isListed(lesson.status))
    if (listed.length > 0) units.push({ unit, lessons: listed })

    const comingInUnit = unitIsComing
      ? inUnit.filter((lesson) => lesson.status !== 'disabled').length
      : inUnit.filter((lesson) => lesson.status === 'coming_soon').length
    comingCount += comingInUnit

    const holdsComing = listed.length === 0 && (comingInUnit > 0 || unit.status === 'coming_soon')
    if (holdsComing && !seenComingUnitIds.has(unit.id)) {
      seenComingUnitIds.add(unit.id)
      comingTitles.push(unit.title)
    }
  }

  return { units, coming: { count: comingCount, unitTitles: comingTitles } }
}
