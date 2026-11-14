import type { LearnerPath } from '../../hooks/use-path'
import type { ActivityStep, LessonExample, LessonStep } from '../../types/lesson-steps'
import type { LessonActivity, Tables } from '../../types/supabase'

import { buildLessonSteps, taughtWords } from '../build-lesson-steps'
import * as variants from '../kabiye-variants'
import { isInteractive, practisedWords } from '../lesson-outcomes'
import { advance, answer, decode, fingerprintLesson, initialSession, reviewOutcomes } from '../lesson-session'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supabase: { url: 'https://isdeilllppdfngxmsols.supabase.co' } } } },
}))

const HOSTED = 'https://isdeilllppdfngxmsols.supabase.co/storage/v1/object/public/audios/'

// Headwords from the dictionary; the notes are English placeholders, not Kabiyè.
const word = (kbp: string, lexeme_id?: string): LessonExample => ({
  kbp,
  lexeme_id,
  en: `gloss of ${kbp}`,
  note: { en: 'n' },
})

const section = (index: number, examples: LessonExample[]): Tables<'lesson_contents'> => ({
  id: `c${index}`,
  lesson_id: 'L',
  kind: 'prose',
  position: index,
  created_at: null,
  title_en: `Section ${index}`,
  title_fr: `Section ${index}`,
  content_en: `Rule ${index}`,
  content_fr: `Règle ${index}`,
  examples: examples as unknown as Tables<'lesson_contents'>['examples'],
})

const activity = (id: string, activity_type: string, data: Record<string, unknown>): LessonActivity => ({
  id,
  lesson_id: 'L',
  activity_type,
  data: data as LessonActivity['data'],
  position: 0,
  created_at: null,
  question_en: null,
  question_fr: null,
  instructions_en: null,
  instructions_fr: null,
})

const getValue = (obj: object | null | undefined, field: string) =>
  ((obj as Record<string, string> | null)?.[`${field}_en`] as string | undefined) ?? null

const contents = [section(0, [word('keɖe', 'keɖe#1'), word('tamaɣ', 'tamaɣ#1')]), section(1, [word('wɩʋ', 'wɩʋ')])]
const activities = [
  activity('a1', 'spell', { correct: 'keɖe' }),
  activity('a2', 'match_pairs', { lexeme_id: 'wɩʋ' }),
  activity('a3', 'multiple_choice', {}),
  // A generated listening activity with the stock placeholder: dropped, as today.
  activity('a4', 'listen_choose', { audio_url: 'https://audio-samples.github.io/x.mp3', correct_answer: 'tamaɣ' }),
]

const build = (audioFor: (w: LessonExample) => string | undefined, lessonContents = contents) => {
  const { words, sectionOf } = taughtWords(lessonContents)
  return buildLessonSteps({
    lessonId: 'L',
    contents: lessonContents,
    activities,
    words,
    sectionOf,
    getValue,
    audioFor,
    path: null,
  })
}

const shape = (steps: LessonStep[]) =>
  steps.map((s) => [s.id, s.type, 'wordKbp' in s ? (s.wordKbp ?? null) : null] as const)

describe('buildLessonSteps', () => {
  // The listening questions are new. A lesson with no recordings must not change at all:
  // its steps are also the saved-session fingerprint.
  it('builds exactly the pre-audio steps when no word has a recording', () => {
    expect(shape(build(() => undefined))).toEqual([
      ['cover', 'cover', null],
      ['teach-keɖe', 'teach', null],
      ['activity-a1', 'spell', 'keɖe'],
      ['teach-tamaɣ', 'teach', null],
      ['rule-0', 'content', null],
      ['teach-wɩʋ', 'teach', null],
      ['activity-a2', 'match_pairs', 'wɩʋ'],
      ['rule-1', 'content', null],
      ['activity-a3', 'multiple_choice', null],
      ['completion', 'completion', null],
    ])
  })

  // Review round 2 (P3): the shape above can hold while `activity.data` or the teach
  // examples drift, and any drift deletes every saved session on update. This value is
  // what origin/develop's inline builder (lesson.tsx before this branch) gives the same
  // fixture.
  it('fingerprints a lesson with no recordings exactly as the pre-audio builder did', () => {
    expect(fingerprintLesson(build(() => undefined).slice(0, -1))).toBe('zlobkl')
  })

  it('adds a listen_choose after the paired activity of each recorded word', () => {
    const steps = build((w) => (w.kbp === 'keɖe' ? HOSTED + 'keɖe.m4a' : undefined))
    expect(shape(steps).slice(1, 4)).toEqual([
      ['teach-keɖe', 'teach', null],
      ['activity-a1', 'spell', 'keɖe'],
      ['activity-listen-choose-keɖe', 'listen_choose', 'keɖe'],
    ])
    expect(steps.filter((s) => s.type === 'listen_choose')).toHaveLength(1)

    const data = (steps[3] as { activity: LessonActivity }).activity.data as {
      audio_url: string
      options: string[]
      correct_answer: string
    }
    expect(data.audio_url).toBe(HOSTED + 'keɖe.m4a')
    expect(data.correct_answer).toBe('keɖe')
    expect([...data.options].sort()).toEqual(['keɖe', 'tamaɣ', 'wɩʋ'].sort())
  })

  it('orders the options the same way on every build', () => {
    const audio = () => HOSTED + 'x.m4a'
    expect(JSON.stringify(build(audio))).toBe(JSON.stringify(build(audio)))
  })

  it('never offers two options spelled alike once tone is set aside', () => {
    const toned = [section(0, [word('keɖe'), word('kéɖé'), word('tamaɣ')])]
    const steps = build((w) => (w.kbp === 'keɖe' ? HOSTED + 'keɖe.m4a' : undefined), toned)
    const listen = steps.find((s) => s.type === 'listen_choose') as { activity: LessonActivity }
    expect([...(listen.activity.data as { options: string[] }).options].sort()).toEqual(['keɖe', 'tamaɣ'].sort())
  })

  it('falls back to listen_type for a lone plain a–z word, and to nothing otherwise', () => {
    const lone = build(() => HOSTED + 'afa.m4a', [section(0, [word('afa')])])
    expect(shape(lone).map(([, type]) => type)).toContain('listen_type')

    const kabiye = build(() => HOSTED + 'sɛtʋ.m4a', [section(0, [word('sɛtʋ')])])
    expect(kabiye.some((s) => s.type === 'listen_type' || s.type === 'listen_choose')).toBe(false)
  })

  it('adds nothing for a recording that is not ours', () => {
    expect(shape(build(() => 'https://example.com/keɖe.mp3'))).toEqual(shape(build(() => undefined)))
  })
})

// The learner's path (speaker, heritage, new) reorders a lesson's steps -- see
// docs/archive/SPEC-path-step-order.md. One fixture with every group of activity: 2 prose
// sections, 4 words (keɖe and wɩʋ with Kabiyè-only letters), a dialogue, notes and a TDA.
describe('buildLessonSteps by path', () => {
  const pathContents: Tables<'lesson_contents'>[] = [
    { ...section(0, [word('caa')]), id: 'd', kind: 'dialogue', title_en: 'Dialogue' },
    section(1, [word('luu', 'luu'), word('keɖe', 'keɖe#1')]),
    section(2, [word('wɩʋ', 'wɩʋ'), word('cee', 'cee')]),
    { ...section(3, []), id: 'n', kind: 'cultural_notes', title_en: 'Notes' },
    { ...section(4, []), id: 't', kind: 'tda', title_en: 'This week' },
  ]
  const pathActivities = [
    activity('m-keɖe', 'match_pairs', { lexeme_id: 'keɖe#1' }),
    activity('s-keɖe', 'spell', { correct: 'keɖe' }),
    activity('f-luu', 'fill_blank', { lexeme_id: 'luu' }),
    activity('s-wɩʋ', 'spell', { lexeme_id: 'wɩʋ' }),
    activity('r-wɩʋ', 'read_choose', { lexeme_id: 'wɩʋ', sentence: 'wɩʋ', options: { en: ['stone', 'water'] } }),
    activity('q-cee', 'multiple_choice', { lexeme_id: 'cee' }),
    // No taught word claims these three. A listening question is "Other": rank 1 on
    // every path.
    activity('u-listen', 'listen_choose', {
      audio_url: HOSTED + 'tɛɛ.m4a',
      options: ['tɛɛ', 'cee'],
      correct_answer: 'tɛɛ',
    }),
    activity('u-order', 'order_words', {}),
    activity('u-spot', 'spot_letter', { correct: 'tɛɛ', distractors: ['tee', 'tɛe'] }),
  ]

  const PATHS: (LearnerPath | null)[] = [null, 'new', 'speaker', 'heritage']

  const buildFor = (path: LearnerPath | null) => {
    const { words, sectionOf } = taughtWords(pathContents)
    return buildLessonSteps({
      lessonId: 'L',
      contents: pathContents,
      activities: pathActivities,
      words,
      sectionOf,
      getValue,
      audioFor: () => undefined,
      path,
    })
  }

  const TODAY = [
    ['cover', 'cover', null],
    ['dialogue', 'dialogue', null],
    ['teach-luu', 'teach', null],
    ['activity-f-luu', 'fill_blank', 'luu'],
    ['teach-keɖe', 'teach', null],
    ['activity-m-keɖe', 'match_pairs', 'keɖe'],
    ['rule-0', 'content', null],
    ['teach-wɩʋ', 'teach', null],
    ['activity-s-wɩʋ', 'spell', 'wɩʋ'],
    ['teach-cee', 'teach', null],
    ['activity-q-cee', 'multiple_choice', 'cee'],
    ['rule-1', 'content', null],
    ['activity-s-keɖe', 'spell', null],
    ['activity-r-wɩʋ', 'read_choose', null],
    ['activity-u-listen', 'listen_choose', null],
    ['activity-u-order', 'order_words', null],
    ['activity-u-spot', 'spot_letter', null],
    ['notes', 'notes', null],
    ['completion', 'completion', null],
  ]

  // Pinned against the builder before the path existed: the default path must not move.
  it.each([null, 'new'] as const)('builds exactly today’s steps and fingerprint for path %p', (path) => {
    const steps = buildFor(path)
    expect(shape(steps)).toEqual(TODAY)
    expect(steps.map((s) => s.order)).toEqual(steps.map((_, i) => i))
    expect(fingerprintLesson(steps.slice(0, -1))).toBe('1b489f1')
  })

  // The heritage order of #105, pinned before the speaker path gained built steps
  // (docs/archive/SPEC-speaker-spot-letter.md): heritage must not move either.
  it('builds #105’s steps and fingerprint for heritage', () => {
    const steps = buildFor('heritage')
    expect(steps.some((s) => 'built' in s)).toBe(false)
    expect(fingerprintLesson(steps.slice(0, -1))).toBe('yfjaj1')
  })

  it('speaker: pairs a word to its spelling activity, and puts unclaimed spelling first', () => {
    const steps = shape(buildFor('speaker'))
    // keɖe matches a match_pairs and a spell: the spell wins.
    expect(steps.slice(4, 6)).toEqual([
      ['teach-keɖe', 'teach', null],
      ['activity-s-keɖe', 'spell', 'keɖe'],
    ])
    expect(steps.slice(12, 17)).toEqual([
      ['activity-u-spot', 'spot_letter', null],
      ['activity-m-keɖe', 'match_pairs', null],
      ['activity-r-wɩʋ', 'read_choose', null],
      ['activity-u-listen', 'listen_choose', null],
      ['activity-u-order', 'order_words', null],
    ])
  })

  it('heritage: recognition wins the pairing, and production waits for the section’s last word', () => {
    const steps = shape(buildFor('heritage'))
    // luu is paired only to fill_blank: after keɖe, the section's last word, and before
    // rule-0, still paired to luu.
    expect(steps.slice(2, 7)).toEqual([
      ['teach-luu', 'teach', null],
      ['teach-keɖe', 'teach', null],
      ['activity-m-keɖe', 'match_pairs', 'keɖe'],
      ['activity-f-luu', 'fill_blank', 'luu'],
      ['rule-0', 'content', null],
    ])
    // wɩʋ matches a spell and a read_choose: the read_choose wins.
    expect(steps.slice(7, 9)).toEqual([
      ['teach-wɩʋ', 'teach', null],
      ['activity-r-wɩʋ', 'read_choose', 'wɩʋ'],
    ])
    // Recognition first, then rank 1 (listening, spot_letter) in list order, then
    // production.
    expect(steps.slice(12, 17).map(([id]) => id)).toEqual([
      'activity-u-listen',
      'activity-u-spot',
      'activity-s-keɖe',
      'activity-s-wɩʋ',
      'activity-u-order',
    ])
    expect(buildFor('heritage').map((s) => s.order)).toEqual(steps.map((_, i) => i))
  })

  it('counts the same practised words on every path', () => {
    const practised = PATHS.map((path) => {
      const steps = buildFor(path)
      const answers = new Map(steps.map((s) => [s.id, 'answer']))
      return practisedWords(steps, answers).sort()
    })
    expect(practised[0]).toEqual(['cee', 'keɖe', 'luu', 'wɩʋ'])
    for (const words of practised) expect(words).toEqual(practised[0])
  })

  it('keeps cover, dialogue, notes and completion in place on every path', () => {
    for (const path of PATHS) {
      const ids = buildFor(path).map((s) => s.id)
      expect(ids.slice(0, 2)).toEqual(['cover', 'dialogue'])
      expect(ids.slice(-2)).toEqual(['notes', 'completion'])
      expect(ids.indexOf('rule-0')).toBe(6)
      expect(ids.indexOf('rule-1')).toBe(11)
    }
  })
})

// The speaker path's app-built "spot the letter" (docs/archive/SPEC-speaker-spot-letter.md).
// Headwords from the lesson files; the glosses are placeholders.
describe('buildLessonSteps: built spot the letter for speaker', () => {
  const buildWith = (
    examples: LessonExample[],
    lessonActivities: LessonActivity[],
    path: LearnerPath | null,
    override?: { words: LessonExample[] }
  ) => {
    const lessonContents = [section(0, examples)]
    const { words, sectionOf } = taughtWords(lessonContents)
    return buildLessonSteps({
      lessonId: 'L',
      contents: lessonContents,
      activities: lessonActivities,
      words: override?.words ?? words,
      sectionOf,
      getValue,
      audioFor: () => undefined,
      path,
    })
  }
  const builtIds = (steps: LessonStep[]) => steps.filter((s) => (s as ActivityStep).built).map((s) => s.id)

  const examples = [
    { ...word('kɛʋ', 'kɛʋ#3'), fr: 'être' },
    word('kumoɖe', 'kumoɖe'),
    word('hɩɖɛ', 'hɩɖɛ#2'),
    word('wɩʋ', 'wɩʋ'),
    word('Ɛsɔ', 'Ɛsɔ'),
  ]
  const lessonActivities = [
    activity('mc-kɛʋ', 'multiple_choice', { lexeme_id: 'kɛʋ#3' }),
    activity('spot-hɩɖɛ', 'spot_letter', { lexeme_id: 'hɩɖɛ#2', correct: 'hɩɖɛ' }),
    activity('spell-wɩʋ', 'spell', { lexeme_id: 'wɩʋ', answer: 'wɩʋ' }),
  ]

  it('puts the step right after the word’s Teach card, before its paired activity', () => {
    const steps = buildWith(examples, lessonActivities, 'speaker')
    const ids = steps.map((s) => s.id)
    const at = ids.indexOf('built-spot-kɛʋ')
    expect(ids.slice(at - 1, at + 2)).toEqual(['teach-kɛʋ', 'built-spot-kɛʋ', 'activity-mc-kɛʋ'])
    const step = steps[at] as ActivityStep
    expect(step).toMatchObject({
      type: 'spot_letter',
      wordKbp: 'kɛʋ',
      built: true,
      activity: {
        id: 'built-spot-kɛʋ',
        activity_type: 'spot_letter',
        lesson_id: 'L',
        data: { correct: 'kɛʋ', gloss: { en: 'gloss of kɛʋ', fr: 'être' } },
      },
    })
    // A gloss language the word does not carry is left out, not written as undefined.
    const capital = steps.find((s) => s.id === 'built-spot-Ɛsɔ') as ActivityStep
    expect(capital.activity.data).toEqual({ correct: 'Ɛsɔ', gloss: { en: 'gloss of Ɛsɔ' } })
    expect(steps.map((s) => s.order)).toEqual(steps.map((_, i) => i))
  })

  it('skips a 1-letter word and a word already paired to spot_letter or spell; counts capitals', () => {
    expect(builtIds(buildWith(examples, lessonActivities, 'speaker'))).toEqual(['built-spot-kɛʋ', 'built-spot-Ɛsɔ'])
  })

  it('skips a word whose variants give fewer than 2 wrong spellings', () => {
    // Two Kabiyè-only letters always give two one-letter misspellings, so this cannot
    // happen with real words; the guard is the step's own `isAnswerable`.
    const spy = jest.spyOn(variants, 'spellingVariants').mockReturnValue([{ text: 'x', swapped: [0] }])
    try {
      expect(builtIds(buildWith(examples, lessonActivities, 'speaker'))).toEqual([])
    } finally {
      spy.mockRestore()
    }
  })

  it('builds at most 3, most Kabiyè-only letters first, ties by teaching order', () => {
    // yɔɔdʋʋ (4 letters) is taught last and still wins; of the four with 2, the first two
    // taught (lɛŋ, kɛʋ) get the other places.
    const many = [word('lɛŋ'), word('kɛʋ'), word('ɖaʋ'), word('wɩsɩ'), word('yɔɔdʋʋ')]
    const steps = buildWith(many, [], 'speaker')
    // Each sits after its own Teach card, in lesson order.
    expect(builtIds(steps)).toEqual(['built-spot-lɛŋ', 'built-spot-kɛʋ', 'built-spot-yɔɔdʋʋ'])
    expect(steps.map((s) => s.id).slice(1, 10)).toEqual([
      'teach-lɛŋ',
      'built-spot-lɛŋ',
      'teach-kɛʋ',
      'built-spot-kɛʋ',
      'teach-ɖaʋ',
      'teach-wɩsɩ',
      'teach-yɔɔdʋʋ',
      'built-spot-yɔɔdʋʋ',
      'rule-0',
    ])
  })

  it('builds one step for a word taught twice, after its first Teach card', () => {
    const twice = [word('kɛʋ'), word('luu')]
    const steps = buildWith(twice, [], 'speaker', { words: [twice[0], twice[1], twice[0]] })
    const ids = steps.map((s) => s.id)
    expect(builtIds(steps)).toEqual(['built-spot-kɛʋ'])
    expect(ids.indexOf('built-spot-kɛʋ')).toBe(ids.indexOf('teach-kɛʋ') + 1)
  })

  it.each([null, 'new', 'heritage'] as const)('builds none for path %p', (path) => {
    expect(builtIds(buildWith(examples, lessonActivities, path))).toEqual([])
  })

  it('never counts a built step as practised or spelled, and reviews it when missed', () => {
    const answerAll = (steps: LessonStep[]) => new Map(steps.map((s) => [s.id, 'answer']))
    const speaker = buildWith(examples, lessonActivities, 'speaker')
    const plain = buildWith(examples, lessonActivities, null)
    expect(practisedWords(speaker, answerAll(speaker))).toEqual(practisedWords(plain, answerAll(plain)))
    // The built step alone answered: kɛʋ is still not practised.
    expect(practisedWords(speaker, new Map([['built-spot-kɛʋ', 'kɛʋ']]))).toEqual([])

    const lessonSteps = speaker.slice(0, -1)
    const built = lessonSteps.find((s) => s.id === 'built-spot-kɛʋ')!
    const right = answer(initialSession(fingerprintLesson(lessonSteps)), built, 'kɛʋ', true)
    expect(right.effects).toEqual([])

    // Missed, it goes to the review round by its step id like any other step.
    let state = answer(initialSession(fingerprintLesson(lessonSteps)), built, 'keʋ', false).state
    while (state.phase === 'lesson') state = advance(state, lessonSteps).state
    expect(state.phase).toBe('review')
    expect(state.reviewStepIds).toEqual(['built-spot-kɛʋ'])
  })
})

// Verifier edge cases for docs/archive/SPEC-speaker-spot-letter.md: the built step through
// the whole session (lesson, review, finish, saved session), as `lesson.tsx` drives it.
// kalʋʋ has no activity at all, so on every path it is only met.
describe('built spot the letter through a lesson session', () => {
  const sessionExamples = [word('kɛʋ', 'kɛʋ#3'), word('kalʋʋ'), word('wɩʋ', 'wɩʋ')]
  const sessionActivities = [
    activity('mc-kɛʋ', 'multiple_choice', { lexeme_id: 'kɛʋ#3' }),
    activity('spell-wɩʋ', 'spell', { lexeme_id: 'wɩʋ', answer: 'wɩʋ' }),
  ]
  // A fresh build from fresh objects each call, as a remount or a reopened lesson does.
  const lessonStepsFor = (path: LearnerPath | null) => {
    const lessonContents = [
      section(
        0,
        sessionExamples.map((w) => ({ ...w }))
      ),
    ]
    const { words, sectionOf } = taughtWords(lessonContents)
    const steps = buildLessonSteps({
      lessonId: 'L',
      contents: lessonContents,
      activities: sessionActivities.map((a) => ({ ...a, data: { ...(a.data as object) } })),
      words,
      sectionOf,
      getValue,
      audioFor: () => undefined,
      path,
    })
    return steps.slice(0, -1) // `lesson.tsx` drops the completion step
  }

  /** Walk the lesson as `lesson.tsx` does: answer each interactive step, then advance.
   *  `wrong` steps are missed in the lesson phase and answered right in review. Stops at
   *  `stopInReview` (that many review items answered) to stand for a saved session. */
  const walk = (steps: LessonStep[], wrong: ReadonlySet<string>, stopInReview = Infinity) => {
    let state = initialSession(fingerprintLesson(steps))
    const written: string[] = []
    const run = (step: LessonStep, isCorrect: boolean) => {
      // A right answer is the word itself: `markWritten` records the text the learner gave.
      const given = isCorrect ? ((step as ActivityStep).wordKbp ?? 'right') : 'wrong'
      const answered = answer(state, step, given, isCorrect)
      for (const e of answered.effects) if (e.kind === 'markWritten') written.push(e.headword)
      state = advance(answered.state, steps).state
    }
    while (state.phase === 'lesson') {
      const step = steps[state.lessonIndex]
      if (isInteractive(step)) run(step, !wrong.has(step.id))
      else state = advance(state, steps).state
    }
    let reviewed = 0
    while (state.phase === 'review' && reviewed < stopInReview) {
      const original = steps.find((s) => s.id === state.reviewStepIds[state.reviewIndex])!
      run({ ...original, id: `retry-${original.id}` } as LessonStep, true)
      reviewed++
    }
    return { state, written }
  }

  it('a missed built step comes back in review, resolves, and still practises nothing', () => {
    const speaker = lessonStepsFor('speaker')
    expect(speaker.filter((s) => (s as ActivityStep).built).map((s) => s.id)).toEqual([
      'built-spot-kɛʋ',
      'built-spot-kalʋʋ',
    ])

    const { state, written } = walk(speaker, new Set(['built-spot-kalʋʋ']))
    expect(state.phase).toBe('finish')
    expect(state.reviewStepIds).toEqual(['built-spot-kalʋʋ'])
    expect(state.answers['retry-built-spot-kalʋʋ']).toMatchObject({ isCorrect: true, supported: false })
    // Finish names it in its review line: "kalʋʋ came back for a second try."
    expect(reviewOutcomes(state, speaker)).toEqual([{ word: 'kalʋʋ', outcome: 'right' }])
    // ...but the practised words are the `new` path's, so kalʋʋ stays under "Words you met".
    const plain = lessonStepsFor('new')
    const plainRun = walk(plain, new Set())
    const practised = (steps: LessonStep[], answers: object) => practisedWords(steps, new Map(Object.entries(answers)))
    expect(practised(speaker, state.answers)).toEqual(['kɛʋ', 'wɩʋ'])
    expect(practised(speaker, state.answers)).toEqual(practised(plain, plainRun.state.answers))
    // Only the authored spell marks a word written, on both paths.
    expect(written).toEqual(['wɩʋ'])
    expect(plainRun.written).toEqual(['wɩʋ'])
  })

  it('a session saved in review on a built step resumes on the next speaker build, not on new', () => {
    const first = lessonStepsFor('speaker')
    const { state } = walk(first, new Set(['built-spot-kɛʋ', 'built-spot-kalʋʋ']), 1)
    expect(state.phase).toBe('review')
    expect(state.reviewIndex).toBe(1)
    const saved = JSON.stringify({ ...state, lessonStepCount: first.length })

    // Reopened: a second build of the same lesson has the same fingerprint, so the saved
    // review (and its `retry-built-spot-…` answer) is accepted where it stopped.
    const second = lessonStepsFor('speaker')
    expect(fingerprintLesson(second)).toBe(fingerprintLesson(first))
    const restored = decode(saved, second, fingerprintLesson(second))
    expect(restored).toMatchObject({ phase: 'review', reviewIndex: 1, reviewStepIds: state.reviewStepIds })
    expect(Object.keys(restored!.answers)).toContain('retry-built-spot-kɛʋ')

    // The path changed to new: those steps are gone, so the session is stale, not resumed
    // onto the wrong question. And the other way round, once (the spec's accepted cost).
    const plain = lessonStepsFor('new')
    expect(decode(saved, plain, fingerprintLesson(plain))).toBeNull()
    const plainSaved = JSON.stringify(initialSession(fingerprintLesson(plain)))
    expect(decode(plainSaved, second, fingerprintLesson(second))).toBeNull()
  })
})
