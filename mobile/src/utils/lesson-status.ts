export type LessonStatus = 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null

/**
 * Whether a lesson (or a unit, which shares the same status column) has content a
 * learner can actually open and read.
 *
 * `available` is the ordinary case; `null` is a row that predates the status column and
 * has always behaved as available. Everything else -- `coming_soon`, `maintenance`,
 * `disabled` -- is not written, whatever else it is shown as (a "Being corrected" row, a
 * count in the "More lessons coming" block, or nothing at all).
 */
export function isWritten(status: LessonStatus): boolean {
  return status === 'available' || status === null
}
