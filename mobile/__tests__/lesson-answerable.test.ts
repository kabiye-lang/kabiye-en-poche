/**
 * A step that renders nothing is worse than a missing step: the learner lands on a blank
 * screen with the progress bar advanced and no way forward. `isAnswerable` in
 * utils/build-lesson-steps.ts is what keeps those out of the list, so it is pinned here.
 *
 * The retry-queue mirror that used to live in this file (`walkedSteps` built from
 * `missed` + `retriesQueued`) was replaced by the review stage in
 * `utils/lesson-session.ts` -- see `utils/__tests__/lesson-session.test.ts` for its
 * coverage: "freezes the review list once entered" and "no misses means no review phase"
 * are what this file's old "retry queue" suite used to pin.
 */
import { isAnswerable } from '../src/utils/build-lesson-steps'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supabase: { url: 'https://isdeilllppdfngxmsols.supabase.co' } } } },
}))

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

  it('drops audio activities whose recording is not hosted by us', () => {
    expect(
      isAnswerable({ activity_type: 'listen_choose', data: { audio_url: 'https://audio-samples.github.io/x.mp3' } })
    ).toBe(false)
  })

  it('leaves ordinary activities alone', () => {
    expect(isAnswerable({ activity_type: 'match_pairs', data: {} })).toBe(true)
  })
})
