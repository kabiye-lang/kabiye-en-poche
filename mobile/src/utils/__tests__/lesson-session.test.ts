import type { LessonStep } from '../../types/lesson-steps'
import type { LessonActivity } from '../../types/supabase'
import type { LessonSession } from '../lesson-session'

import {
  advance,
  answer,
  decode,
  fingerprintLesson,
  initialSession,
  progressView,
  reviewOutcomes,
  showWord,
} from '../lesson-session'

const activity = (overrides: Partial<LessonActivity> = {}): LessonActivity =>
  ({ id: 'row-1', activity_type: 'multiple_choice', data: { correct_answer: 'yes' }, ...overrides }) as LessonActivity

const interactiveStep = (
  id: string,
  overrides: Partial<LessonStep> & { wordKbp?: string; type?: LessonStep['type'] } = {}
): LessonStep =>
  ({
    id,
    type: 'multiple_choice',
    order: 0,
    activity: activity({ id: `${id}-row` }),
    ...overrides,
  }) as LessonStep

const coverStep = (): LessonStep => ({ id: 'cover', type: 'cover', order: 0, words: [] }) as LessonStep
const contentStep = (id: string): LessonStep => ({ id, type: 'content', order: 0, content: 'rule' }) as LessonStep
const teachStep = (id: string, kbp: string): LessonStep =>
  ({ id, type: 'teach', order: 0, example: { kbp } }) as LessonStep

/** A handful of differently-shaped lessons -- "loop over all lesson fixtures". */
const fixtures: { name: string; steps: LessonStep[] }[] = [
  {
    name: 'cover + two interactive steps',
    steps: [coverStep(), interactiveStep('q1'), interactiveStep('q2', { type: 'spell' })],
  },
  {
    name: 'cover + teach + mixed interactive + a content rule',
    steps: [
      coverStep(),
      teachStep('teach-a', 'a'),
      interactiveStep('q1', { wordKbp: 'a' }),
      teachStep('teach-b', 'b'),
      interactiveStep('q2', { type: 'spell', wordKbp: 'b' }),
      contentStep('rule-0'),
      interactiveStep('q3', { type: 'read_choose' }),
    ],
  },
  {
    name: 'cover only, nothing to get wrong',
    steps: [coverStep()],
  },
]

describe('fingerprintLesson', () => {
  it('is stable for the same steps and changes when activity data changes', () => {
    const steps = fixtures[0].steps
    const again = fingerprintLesson(steps)
    expect(fingerprintLesson(steps)).toBe(again)

    const edited = steps.map((s) =>
      s.id === 'q1' ? { ...s, activity: activity({ id: 'q1-row', data: { correct_answer: 'no' } }) } : s
    ) as LessonStep[]
    expect(fingerprintLesson(edited)).not.toBe(fingerprintLesson(steps))
  })
})

describe('advance', () => {
  it('keeps the lesson total constant while walking the lesson phase', () => {
    for (const { steps } of fixtures) {
      let state = initialSession(fingerprintLesson(steps))
      const total = progressView(state, steps).total
      while (state.phase === 'lesson') {
        state = advance(state, steps).state
        expect(progressView(state, steps).kind === 'lesson' ? progressView(state, steps).total : total).toBe(total)
      }
    }
  })

  it('freezes the review list once entered -- later wrong answers do not extend it', () => {
    const steps = fixtures[1].steps
    let state = initialSession(fingerprintLesson(steps))
    // Answer every interactive step wrong in lesson phase.
    for (const step of steps) {
      if (state.phase !== 'lesson') break
      if ('activity' in step) state = answer(state, step, 'wrong', false).state
      state = advance(state, steps).state
    }
    expect(state.phase).toBe('review')
    const frozen = [...state.reviewStepIds]

    // Miss the first review item too -- the frozen list must not grow.
    const first = steps.find((s) => s.id === frozen[0])!
    state = answer(state, { ...first, id: `retry-${first.id}` } as LessonStep, 'wrong again', false).state
    state = advance(state, steps).state
    expect(state.reviewStepIds).toEqual(frozen)
  })

  it('no misses means no review phase', () => {
    const steps = fixtures[0].steps
    let state = initialSession(fingerprintLesson(steps))
    for (const step of steps) {
      if ('activity' in step) state = answer(state, step, 'right', true).state
      state = advance(state, steps).state
    }
    expect(state.phase).toBe('finish')
    expect(state.reviewStepIds).toEqual([])
  })

  it('reaches finish in at most lessonSteps + reviewItems transitions, answering everything wrong', () => {
    for (const { steps } of fixtures) {
      let state = initialSession(fingerprintLesson(steps))
      let transitions = 0
      const interactiveCount = steps.filter((s) => 'activity' in s).length
      const bound = steps.length + interactiveCount // every interactive step could come back once

      while (state.phase !== 'finish' && transitions <= bound) {
        const stepForPhase =
          state.phase === 'lesson'
            ? steps[state.lessonIndex]
            : state.phase === 'review'
              ? (() => {
                  const originalId = state.reviewStepIds[state.reviewIndex]
                  const original = steps.find((s) => s.id === originalId)!
                  return { ...original, id: `retry-${originalId}` } as LessonStep
                })()
              : undefined
        if (stepForPhase && 'activity' in stepForPhase) {
          state = answer(state, stepForPhase, 'wrong', false).state
        }
        state = advance(state, steps).state
        transitions++
      }

      expect(state.phase).toBe('finish')
      expect(transitions).toBeLessThanOrEqual(bound)
    }
  })

  it('emits addMet exactly once, on the transition into finish', () => {
    const steps = fixtures[1].steps
    let state = initialSession(fingerprintLesson(steps))
    let addMetCount = 0
    for (const step of steps) {
      if ('activity' in step) state = answer(state, step, 'wrong', false).state
      const { state: next, effects } = advance(state, steps)
      addMetCount += effects.filter((e) => e.kind === 'addMet').length
      state = next
    }
    // Now in review -- walk it out.
    while (state.phase === 'review') {
      const originalId = state.reviewStepIds[state.reviewIndex]
      const original = steps.find((s) => s.id === originalId)!
      state = answer(state, { ...original, id: `retry-${originalId}` } as LessonStep, 'right', true).state
      const { state: next, effects } = advance(state, steps)
      addMetCount += effects.filter((e) => e.kind === 'addMet').length
      state = next
    }
    expect(state.phase).toBe('finish')
    expect(addMetCount).toBe(1)
  })

  it('emits announceReview exactly when entering review', () => {
    const steps = fixtures[0].steps
    let state = initialSession(fingerprintLesson(steps))
    const announcements: number[] = []
    for (const step of steps) {
      if ('activity' in step) state = answer(state, step, 'wrong', false).state
      const { state: next, effects } = advance(state, steps)
      if (effects.some((e) => e.kind === 'announceReview')) announcements.push(1)
      state = next
    }
    expect(announcements).toHaveLength(1)
    expect(state.phase).toBe('review')
  })
})

describe('answer', () => {
  const steps = fixtures[0].steps

  it('emits markWritten only for an unsupported correct spell answer', () => {
    let state = initialSession(fingerprintLesson(steps))
    state = advance(state, steps).state // past cover, onto q1 (multiple_choice)
    const q1 = steps.find((s) => s.id === 'q1')!
    const { effects: mcEffects } = answer(state, q1, 'yes', true)
    expect(mcEffects.some((e) => e.kind === 'markWritten')).toBe(false)

    state = answer(state, q1, 'yes', true).state
    state = advance(state, steps).state // onto q2 (spell)
    const q2 = steps.find((s) => s.id === 'q2')!
    const { effects: spellEffects } = answer(state, q2, 'kɛlɩm', true)
    expect(spellEffects).toEqual([{ kind: 'markWritten', headword: 'kɛlɩm' }])
  })

  it('does not emit markWritten for a spell answer given after Show the word again', () => {
    // Build a session already in review, on a spell retry, shown.
    let state: LessonSession = {
      ...initialSession(fingerprintLesson(fixtures[1].steps)),
      phase: 'review',
      reviewStepIds: ['q2'],
      reviewIndex: 0,
      answers: { q2: { answer: 'wrong', isCorrect: false, supported: false } },
    }
    state = showWord(state)
    const q2 = fixtures[1].steps.find((s) => s.id === 'q2')!
    const retryStep = { ...q2, id: 'retry-q2' } as LessonStep
    const { effects, state: next } = answer(state, retryStep, 'b', true)
    expect(effects.some((e) => e.kind === 'markWritten')).toBe(false)
    expect(next.answers['retry-q2']).toEqual({ answer: 'b', isCorrect: true, supported: true })
  })

  it('a second answer for an already-answered id is ignored (double tap)', () => {
    let state = initialSession(fingerprintLesson(steps))
    state = advance(state, steps).state
    const q1 = steps.find((s) => s.id === 'q1')!
    state = answer(state, q1, 'first', true).state
    const { state: after, effects } = answer(state, q1, 'second', false)
    expect(after).toBe(state) // unchanged reference: a true no-op
    expect(effects).toEqual([])
    expect(state.answers.q1).toEqual({ answer: 'first', isCorrect: true, supported: false })
  })
})

describe('showWord', () => {
  it('is a no-op outside review phase', () => {
    const state = initialSession(fingerprintLesson(fixtures[0].steps))
    expect(showWord(state)).toBe(state)
  })

  it('adds the current retry id once, idempotently', () => {
    let state: LessonSession = {
      ...initialSession(fingerprintLesson(fixtures[0].steps)),
      phase: 'review',
      reviewStepIds: ['q1'],
      reviewIndex: 0,
    }
    state = showWord(state)
    expect(state.shown).toEqual(['retry-q1'])
    state = showWord(state)
    expect(state.shown).toEqual(['retry-q1'])
  })
})

describe('decode', () => {
  const steps = fixtures[1].steps
  const fingerprint = fingerprintLesson(steps)
  const valid = (): LessonSession => ({
    v: 1,
    fingerprint,
    phase: 'lesson',
    lessonIndex: 0,
    reviewStepIds: [],
    reviewIndex: 0,
    answers: {},
    shown: [],
  })

  it('rejects malformed JSON', () => {
    expect(decode('{not json', steps, fingerprint)).toBeNull()
  })

  it('accepts a well-formed session', () => {
    expect(decode(JSON.stringify(valid()), steps, fingerprint)).toEqual(valid())
  })

  it('rejects a fingerprint mismatch (same ids, changed correct answer)', () => {
    const edited = steps.map((s) =>
      s.id === 'q1' ? { ...s, activity: activity({ id: 'q1-row', data: { correct_answer: 'no' } }) } : s
    ) as LessonStep[]
    const changedFingerprint = fingerprintLesson(edited)
    expect(decode(JSON.stringify(valid()), edited, changedFingerprint)).toBeNull()
  })

  it('rejects an out-of-range lessonIndex', () => {
    expect(decode(JSON.stringify({ ...valid(), lessonIndex: steps.length }), steps, fingerprint)).toBeNull()
    expect(decode(JSON.stringify({ ...valid(), lessonIndex: -1 }), steps, fingerprint)).toBeNull()
  })

  it('rejects a reviewStepIds entry that is not an interactive step id', () => {
    const bad = {
      ...valid(),
      phase: 'review',
      reviewStepIds: ['rule-0'],
      answers: { 'rule-0': { answer: 'x', isCorrect: false, supported: false } },
    }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
  })

  it('rejects duplicate reviewStepIds', () => {
    const bad = {
      ...valid(),
      phase: 'review',
      reviewStepIds: ['q1', 'q1'],
      answers: { q1: { answer: 'x', isCorrect: false, supported: false } },
    }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
  })

  it('rejects review phase with an empty reviewStepIds', () => {
    expect(decode(JSON.stringify({ ...valid(), phase: 'review' }), steps, fingerprint)).toBeNull()
  })

  it('rejects an out-of-range reviewIndex', () => {
    const bad = {
      ...valid(),
      phase: 'review',
      reviewStepIds: ['q1'],
      reviewIndex: 2,
      answers: { q1: { answer: 'x', isCorrect: false, supported: false } },
    }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
  })

  it('rejects a review session already past its last item -- it would render no step', () => {
    const bad = {
      ...valid(),
      phase: 'review',
      reviewStepIds: ['q1'],
      reviewIndex: 1,
      answers: { q1: { answer: 'x', isCorrect: false, supported: false } },
    }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
    // The same index is fine once the walk has moved on to finish.
    expect(decode(JSON.stringify({ ...bad, phase: 'finish' }), steps, fingerprint)).not.toBeNull()
  })

  it('rejects a reviewStepIds member never answered wrong', () => {
    const bad = {
      ...valid(),
      phase: 'review',
      reviewStepIds: ['q1'],
      answers: { q1: { answer: 'x', isCorrect: true, supported: false } },
    }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
  })

  it('rejects an answer key that is neither a known id nor retry-{reviewStepIds member}', () => {
    const bad = { ...valid(), answers: { 'not-a-step': { answer: 'x', isCorrect: true, supported: false } } }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
  })

  it('rejects a malformed answer entry', () => {
    const bad = { ...valid(), answers: { q1: { answer: 'x' } } }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
  })

  it('rejects a shown id outside retry-{reviewStepIds}', () => {
    const bad = {
      ...valid(),
      phase: 'review',
      reviewStepIds: ['q1'],
      answers: { q1: { answer: 'x', isCorrect: false, supported: false } },
      shown: ['retry-q2'],
    }
    expect(decode(JSON.stringify(bad), steps, fingerprint)).toBeNull()
  })

  it('rejects an unknown phase', () => {
    expect(decode(JSON.stringify({ ...valid(), phase: 'oops' }), steps, fingerprint)).toBeNull()
  })
})

describe('progressView', () => {
  const steps = fixtures[1].steps

  it('lesson phase', () => {
    const state = { ...initialSession(fingerprintLesson(steps)), lessonIndex: 2 }
    expect(progressView(state, steps)).toEqual({ kind: 'lesson', current: 3, total: steps.length })
  })

  it('review phase, first item is isStart', () => {
    const state: LessonSession = {
      ...initialSession(fingerprintLesson(steps)),
      phase: 'review',
      reviewStepIds: ['q1', 'q2'],
      reviewIndex: 0,
    }
    expect(progressView(state, steps)).toEqual({ kind: 'review', current: 1, total: 2, isStart: true })
  })

  it('review phase, second item is not isStart', () => {
    const state: LessonSession = {
      ...initialSession(fingerprintLesson(steps)),
      phase: 'review',
      reviewStepIds: ['q1', 'q2'],
      reviewIndex: 1,
    }
    expect(progressView(state, steps)).toEqual({ kind: 'review', current: 2, total: 2, isStart: false })
  })

  it('finish phase draws the lesson bar full', () => {
    const state: LessonSession = { ...initialSession(fingerprintLesson(steps)), phase: 'finish' }
    expect(progressView(state, steps)).toEqual({ kind: 'finish', total: steps.length })
  })
})

describe('reviewOutcomes', () => {
  const steps = fixtures[1].steps // q1 -> wordKbp 'a', q2 (spell) -> wordKbp 'b', q3 -> no wordKbp

  it('one outcome per word: right, helped, missed', () => {
    const state: LessonSession = {
      ...initialSession(fingerprintLesson(steps)),
      phase: 'finish',
      reviewStepIds: ['q1', 'q2'],
      answers: {
        'retry-q1': { answer: 'a', isCorrect: true, supported: false },
        'retry-q2': { answer: 'b', isCorrect: true, supported: true },
      },
    }
    expect(reviewOutcomes(state, steps)).toEqual([
      { word: 'a', outcome: 'right' },
      { word: 'b', outcome: 'helped' },
    ])
  })

  it('a review item with no wordKbp is asked but not named', () => {
    const state: LessonSession = {
      ...initialSession(fingerprintLesson(steps)),
      phase: 'finish',
      reviewStepIds: ['q3'],
      answers: { 'retry-q3': { answer: 'x', isCorrect: true, supported: false } },
    }
    expect(reviewOutcomes(state, steps)).toEqual([])
  })

  it('the same word claimed by two review items keeps the worst outcome', () => {
    const twoForA: LessonStep[] = [...steps, interactiveStep('q4', { type: 'fill_blank', wordKbp: 'a' })]
    const state: LessonSession = {
      ...initialSession(fingerprintLesson(twoForA)),
      phase: 'finish',
      reviewStepIds: ['q1', 'q4'],
      answers: {
        'retry-q1': { answer: 'a', isCorrect: true, supported: false }, // right
        'retry-q4': { answer: 'wrong', isCorrect: false, supported: false }, // missed
      },
    }
    expect(reviewOutcomes(state, twoForA)).toEqual([{ word: 'a', outcome: 'missed' }])
  })

  it('an unanswered review item counts as missed', () => {
    const state: LessonSession = {
      ...initialSession(fingerprintLesson(steps)),
      phase: 'review',
      reviewStepIds: ['q1'],
      reviewIndex: 0,
      answers: {},
    }
    expect(reviewOutcomes(state, steps)).toEqual([{ word: 'a', outcome: 'missed' }])
  })
})
