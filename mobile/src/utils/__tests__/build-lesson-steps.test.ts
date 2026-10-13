import type { LessonExample, LessonStep } from '../../types/lesson-steps'
import type { LessonActivity, Tables } from '../../types/supabase'

import { buildLessonSteps, taughtWords } from '../build-lesson-steps'

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
  return buildLessonSteps({ lessonId: 'L', contents: lessonContents, activities, words, sectionOf, getValue, audioFor })
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
