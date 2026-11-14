import type { LearnerPath } from '../../hooks/use-path'
import type { LessonExample, LessonStep } from '../../types/lesson-steps'
import type { LessonActivity, Tables } from '../../types/supabase'

import { buildLessonSteps, taughtWords } from '../build-lesson-steps'
import { practisedWords } from '../lesson-outcomes'
import { fingerprintLesson } from '../lesson-session'

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
// docs/specs/SPEC-path-step-order.md. One fixture with every group of activity: 2 prose
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
    // No taught word claims these two.
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
    expect(fingerprintLesson(steps.slice(0, -1))).toBe('1hjlivd')
  })

  it('speaker: pairs a word to its spelling activity, and puts unclaimed spelling first', () => {
    const steps = shape(buildFor('speaker'))
    // keɖe matches a match_pairs and a spell: the spell wins.
    expect(steps.slice(4, 6)).toEqual([
      ['teach-keɖe', 'teach', null],
      ['activity-s-keɖe', 'spell', 'keɖe'],
    ])
    expect(steps.slice(12, 16)).toEqual([
      ['activity-u-spot', 'spot_letter', null],
      ['activity-m-keɖe', 'match_pairs', null],
      ['activity-r-wɩʋ', 'read_choose', null],
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
    expect(steps.slice(12, 16).map(([id]) => id)).toEqual([
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
