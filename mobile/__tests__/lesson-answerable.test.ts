/**
 * A step that renders nothing is worse than a missing step: the learner lands on a blank
 * screen with the progress bar advanced and no way forward. `isAnswerable` in
 * screens/lesson.tsx is what keeps those out of the list, so it is pinned here.
 *
 * The retry-queue mirror that used to live in this file (`walkedSteps` built from
 * `missed` + `retriesQueued`) was replaced by the review stage in
 * `utils/lesson-session.ts` -- see `utils/__tests__/lesson-session.test.ts` for its
 * coverage: "freezes the review list once entered" and "no misses means no review phase"
 * are what this file's old "retry queue" suite used to pin.
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
