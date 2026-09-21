import type { ActivityStep, LessonStep } from '../../types/lesson-steps'
import type { LessonActivity } from '../../types/supabase'

import { practisedWords } from '../lesson-outcomes'

/** A minimal activity step: the fields `practisedWords` reads, nothing the DB row also
 *  carries -- the activity's own contents never enter the decision. */
const activityStep = (overrides: Partial<ActivityStep> & Pick<ActivityStep, 'id'>): LessonStep =>
  ({
    type: 'multiple_choice',
    order: 0,
    activity: {} as LessonActivity,
    ...overrides,
  }) as LessonStep

const answered = (...ids: string[]) => new Map<string, unknown>(ids.map((id) => [id, { answer: 'x', isCorrect: true }]))

describe('practisedWords', () => {
  it('a recognition-only paired step counts as practised', () => {
    const steps = [activityStep({ id: 'activity-1', wordKbp: 'kɛlɩm' })]
    expect(practisedWords(steps, answered('activity-1'))).toEqual(['kɛlɩm'])
  })

  it('an answer only under retry-{id} still counts as practised', () => {
    const steps = [activityStep({ id: 'activity-1', wordKbp: 'kɛlɩm' })]
    expect(practisedWords(steps, answered('retry-activity-1'))).toEqual(['kɛlɩm'])
  })

  it('a step answered and then retried counts its word once', () => {
    const steps = [activityStep({ id: 'activity-1', wordKbp: 'kɛlɩm' })]
    expect(practisedWords(steps, answered('activity-1', 'retry-activity-1'))).toEqual(['kɛlɩm'])
  })

  it('the same kbp taught (and paired) twice counts once', () => {
    const steps = [
      activityStep({ id: 'activity-1', wordKbp: 'kɛlɩm' }),
      activityStep({ id: 'activity-2', wordKbp: 'kɛlɩm' }),
    ]
    expect(practisedWords(steps, answered('activity-1', 'activity-2'))).toEqual(['kɛlɩm'])
  })

  it('a taught word followed by a non-interactive step is not practised', () => {
    const steps: LessonStep[] = [
      { id: 'teach-kɛlɩm', type: 'teach', order: 0, example: { kbp: 'kɛlɩm' } },
      { id: 'rule-0', type: 'content', order: 1, content: 'ɛlɛ goes between commas' },
    ]
    expect(practisedWords(steps, answered('rule-0'))).toEqual([])
  })

  it('an unpaired legacy activity answered produces no word', () => {
    const steps = [activityStep({ id: 'activity-1' })]
    expect(practisedWords(steps, answered('activity-1'))).toEqual([])
  })

  it('empty answers produce no practised words', () => {
    const steps = [activityStep({ id: 'activity-1', wordKbp: 'kɛlɩm' })]
    expect(practisedWords(steps, new Map())).toEqual([])
  })
})
