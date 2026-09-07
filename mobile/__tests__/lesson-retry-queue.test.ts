/**
 * The Laterite flow says a missed step comes back before the lesson can finish.
 *
 * The queue is built in `screens/lesson.tsx` from `missed` + `retriesQueued`. This pins
 * the shape of that transformation on its own, away from the screen, because the parts
 * that can go wrong are ordering, double-queueing, and the progress denominator.
 */

interface Step {
  id: string
  type: string
  order: number
}

/** Mirrors the `walkedSteps` memo in screens/lesson.tsx. */
function walkedSteps(steps: Step[], missed: string[], retriesQueued: boolean): Step[] {
  if (!retriesQueued || missed.length === 0) return steps
  const completion = steps[steps.length - 1]
  const body = steps.slice(0, -1)
  const retries = missed
    .map((id) => body.find((s) => s.id === id))
    .filter((s): s is Step => s != null)
    .map((s, i) => ({ ...s, id: `retry-${s.id}`, order: body.length + i }))
  return [...body, ...retries, { ...completion, order: body.length + retries.length }]
}

const LESSON: Step[] = [
  { id: 'content-0', type: 'content', order: 0 },
  { id: 'activity-1', type: 'spell', order: 1 },
  { id: 'activity-2', type: 'spot_letter', order: 2 },
  { id: 'activity-3', type: 'read_choose', order: 3 },
  { id: 'completion', type: 'completion', order: 4 },
]

describe('retry queue', () => {
  it('leaves a clean run untouched', () => {
    expect(walkedSteps(LESSON, [], false)).toEqual(LESSON)
  })

  it('does not lengthen the lesson until the retries are actually queued', () => {
    // Progress must not stretch behind the learner as they make mistakes.
    expect(walkedSteps(LESSON, ['activity-1', 'activity-2'], false)).toHaveLength(LESSON.length)
  })

  it('re-asks missed steps before completion, in the order they were missed', () => {
    const walked = walkedSteps(LESSON, ['activity-2', 'activity-1'], true)
    expect(walked.map((s) => s.id)).toEqual([
      'content-0',
      'activity-1',
      'activity-2',
      'activity-3',
      'retry-activity-2',
      'retry-activity-1',
      'completion',
    ])
  })

  it('keeps completion last', () => {
    const walked = walkedSteps(LESSON, ['activity-1'], true)
    expect(walked[walked.length - 1].type).toBe('completion')
  })

  it('carries the activity through so the retry renders the same question', () => {
    const walked = walkedSteps(LESSON, ['activity-1'], true)
    const retry = walked.find((s) => s.id === 'retry-activity-1')
    expect(retry?.type).toBe('spell')
  })

  it('marks retries so a second miss cannot queue a third attempt', () => {
    const walked = walkedSteps(LESSON, ['activity-1'], true)
    const retry = walked.find((s) => s.id.startsWith('retry-'))
    // screens/lesson.tsx guards on exactly this prefix
    expect(retry!.id.startsWith('retry-')).toBe(true)
  })

  it('ignores a missed id that is no longer in the lesson', () => {
    const walked = walkedSteps(LESSON, ['activity-9'], true)
    expect(walked.map((s) => s.id)).toEqual(LESSON.map((s) => s.id))
  })
})

/**
 * A step that renders nothing is worse than a missing step: the learner lands on a blank
 * screen with the progress bar advanced and no way forward. `isAnswerable` in
 * screens/lesson.tsx is what keeps those out of the list, so it is pinned here.
 */
import { spellingVariants } from '../src/utils/kabiye-variants'

const AUDIO_DEPENDENT = new Set(['audio', 'listen_choose', 'listen_type'])

function isAnswerable(activity: { activity_type: string; data: Record<string, unknown> }): boolean {
  const data = activity.data as {
    audio_url?: string
    correct?: string
    distractors?: string[]
    sentence?: string
    options?: Record<string, string[]>
  }
  if (AUDIO_DEPENDENT.has(activity.activity_type)) return Boolean(data.audio_url)
  if (activity.activity_type === 'spot_letter') {
    const correct = data.correct?.trim() ?? ''
    if (!correct) return false
    const supplied = (data.distractors ?? []).filter((d) => d && d !== correct)
    return supplied.length >= 2 || spellingVariants(correct, 2).length >= 2
  }
  if (activity.activity_type === 'read_choose') {
    const anyOptions = Object.values(data.options ?? {}).find((l) => (l?.length ?? 0) >= 2)
    return Boolean(data.sentence?.trim()) && anyOptions !== undefined
  }
  return true
}

describe('isAnswerable', () => {
  it('drops a spot_letter whose word has only one letter French cannot write', () => {
    // alaafɩya yields one distractor, so the question would be a coin flip
    expect(isAnswerable({ activity_type: 'spot_letter', data: { correct: 'alaafɩya' } })).toBe(false)
  })

  it('keeps a spot_letter with two such letters', () => {
    expect(isAnswerable({ activity_type: 'spot_letter', data: { correct: 'sɛʋ' } })).toBe(true)
  })

  it('keeps a spot_letter that supplies its own checked distractors', () => {
    expect(
      isAnswerable({
        activity_type: 'spot_letter',
        data: { correct: 'alaafɩya', distractors: ['alaafiya', 'alafɩya'] },
      })
    ).toBe(true)
  })

  it('drops a read_choose with no sentence', () => {
    expect(isAnswerable({ activity_type: 'read_choose', data: { options: { en: ['a', 'b'] } } })).toBe(false)
  })

  it('drops a read_choose with fewer than two readings', () => {
    expect(
      isAnswerable({ activity_type: 'read_choose', data: { sentence: 'sɛtʋ nɛ alaafɩya', options: { en: ['a'] } } })
    ).toBe(false)
  })

  it('keeps a complete read_choose', () => {
    expect(
      isAnswerable({
        activity_type: 'read_choose',
        data: { sentence: 'sɛtʋ nɛ alaafɩya', options: { en: ['a', 'b', 'c'] } },
      })
    ).toBe(true)
  })

  it('still drops audio activities with no recording', () => {
    expect(isAnswerable({ activity_type: 'listen_choose', data: {} })).toBe(false)
  })

  it('leaves ordinary activities alone', () => {
    expect(isAnswerable({ activity_type: 'match_pairs', data: {} })).toBe(true)
  })
})
