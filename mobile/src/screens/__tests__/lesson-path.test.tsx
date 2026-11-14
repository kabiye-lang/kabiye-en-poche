import type { LearnerPath } from '../../hooks/use-path'
import type { LessonExample } from '../../types/lesson-steps'
import type { LessonActivity, Tables } from '../../types/supabase'

import { SafeAreaProvider } from 'react-native-safe-area-context'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { act, fireEvent, render, screen } from '@testing-library/react-native'

import { sessionKey } from '../../hooks/use-lesson-session'
import { PATH_STORAGE_KEY } from '../../hooks/use-path'
import { buildLessonSteps, taughtWords } from '../../utils/build-lesson-steps'
import { fingerprintLesson } from '../../utils/lesson-session'
import LessonScreen from '../lesson'

// The lesson screen with the learner's path (docs/archive/SPEC-path-step-order.md): it must
// read the stored path before it builds the steps and loads a saved session, or a speaker
// or heritage learner's session is judged stale and dropped every time the lesson opens.
// `usePath`, `useLessonSession` and `buildLessonSteps` are the real ones; only the data
// hooks, the router, audio and storage are stood in.

i18n.load('en', {})
i18n.activate('en')

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({ id: 'L' }),
}))
jest.mock('sonner-native', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('../../hooks/use-audio', () => ({
  useAudio: () => ({ playAudio: jest.fn(), stopAudio: jest.fn(), isPlaying: false, isLoading: false, error: null }),
}))

// Headwords from the dictionary; glosses and notes are English placeholders, not Kabiyè.
const mockWord = (kbp: string, lexeme_id: string): LessonExample => ({
  kbp,
  lexeme_id,
  en: `gloss of ${kbp}`,
  note: { en: `note on ${kbp}` },
})

const mockContents: Tables<'lesson_contents'>[] = [
  {
    id: 'c0',
    lesson_id: 'L',
    kind: 'prose',
    position: 0,
    created_at: null,
    title_en: 'Section 0',
    title_fr: 'Section 0',
    content_en: 'Rule 0',
    content_fr: 'Règle 0',
    examples: [mockWord('luu', 'luu'), mockWord('keɖe', 'keɖe#1')] as unknown as Tables<'lesson_contents'>['examples'],
  },
]

const mockActivity = (id: string, activity_type: string, data: Record<string, unknown>): LessonActivity => ({
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

// luu has only a fill_blank (production): heritage practises it after keɖe. keɖe has a
// multiple_choice (recognition).
const mockActivities = [
  mockActivity('f-luu', 'fill_blank', {
    lexeme_id: 'luu',
    sentence_en: 'A ___ here.',
    answer: 'luu',
    options: ['luu', 'cee'],
  }),
  mockActivity('q-keɖe', 'multiple_choice', {
    lexeme_id: 'keɖe#1',
    question_en: 'What does keɖe mean?',
    options: { en: ['ripe', 'stone'] },
    correct_answer: 'ripe',
  }),
]

const mockGetValue = (obj: object | null | undefined, field: string) =>
  ((obj as Record<string, string> | null)?.[`${field}_en`] as string | undefined) ?? null
const mockNoAudio = () => undefined

jest.mock('../../hooks/use-app-data', () => ({
  useAppLesson: () => ({
    data: { id: 'L', status: 'available', title_en: 'Lesson title' },
    isLoading: false,
    error: null,
  }),
  useAppProgressSummary: () => ({ data: undefined }),
  useAppLessonContents: () => ({ data: mockContents, isLoading: false, error: null }),
  useAppLessonActivities: () => ({ data: mockActivities, isLoading: false, error: null }),
  useAppCompleteLesson: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useAppAlphabetLetters: () => ({ data: [{ id: 'ɖ', pronunciation_en: 'hint for ɖ' }] }),
}))
jest.mock('../../hooks/use-audio-index', () => ({
  useLessonAudio: () => ({ audioFor: mockNoAudio, isSettled: true, clear: jest.fn() }),
}))
jest.mock('../../hooks/use-my-words', () => ({
  useMyWords: () => ({ addMet: jest.fn(() => Promise.resolve([])), markWritten: jest.fn() }),
}))
jest.mock('../../hooks/use-language', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    getValue: mockGetValue,
    getJsonValue: (obj: Record<string, unknown> | null, field: string) => obj?.[field] ?? null,
  }),
}))

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={METRICS}>
    <I18nProvider i18n={i18n}>{children}</I18nProvider>
  </SafeAreaProvider>
)

const flush = () => new Promise((resolve) => setImmediate(resolve))

/** The steps the screen walks for a path: cover through the last practised step. */
const lessonStepsFor = (path: LearnerPath | null) => {
  const { words, sectionOf } = taughtWords(mockContents)
  return buildLessonSteps({
    lessonId: 'L',
    contents: mockContents,
    activities: mockActivities,
    words,
    sectionOf,
    getValue: mockGetValue,
    audioFor: mockNoAudio,
    path,
  }).slice(0, -1)
}

const storedSession = (path: LearnerPath, extra: Record<string, unknown>) =>
  JSON.stringify({
    v: 1,
    fingerprint: fingerprintLesson(lessonStepsFor(path)),
    phase: 'lesson',
    lessonIndex: 0,
    reviewStepIds: [],
    reviewIndex: 0,
    answers: {},
    shown: [],
    ...extra,
  })

/** Storage whose path read the test releases by hand; the session read answers at once. */
function stubStorage(session: string) {
  let releasePath: ((value: string | null) => void) | undefined
  ;(AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
    if (key === PATH_STORAGE_KEY) return new Promise((resolve) => (releasePath = resolve))
    if (key === sessionKey('L')) return Promise.resolve(session)
    return Promise.resolve(null)
  })
  return (path: LearnerPath) =>
    act(async () => {
      releasePath?.(path)
      await flush()
    })
}

const sessionReads = () =>
  (AsyncStorage.getItem as jest.Mock).mock.calls.filter(([key]) => key === sessionKey('L')).length

beforeEach(() => jest.clearAllMocks())

describe('LessonScreen with a learner path', () => {
  it('waits for the stored path, then resumes a heritage session instead of dropping it', async () => {
    const heritage = lessonStepsFor('heritage')
    // The fixture must order the steps differently by path, or this test proves nothing.
    expect(heritage.map((s) => s.id)).not.toEqual(lessonStepsFor(null).map((s) => s.id))
    const at = heritage.findIndex((s) => s.id === 'teach-keɖe')
    expect(at).toBe(2)

    const releasePath = stubStorage(storedSession('heritage', { lessonIndex: at }))
    await render(<LessonScreen />, { wrapper })
    await act(async () => {
      await flush()
    })

    // The path is not read yet: no session is loaded, no step is shown.
    expect(sessionReads()).toBe(0)
    expect(screen.queryByText('New word')).toBeNull()

    await releasePath('heritage')
    await act(async () => {
      await flush()
    })

    expect(sessionReads()).toBe(1)
    expect(AsyncStorage.removeItem).not.toHaveBeenCalledWith(sessionKey('L'))
    // Resumed on keɖe's Teach card, the third heritage step (null would show fill_blank).
    expect(screen.getByText('New word')).toBeTruthy()
    expect(screen.getByText('gloss of keɖe')).toBeTruthy()
  })

  it('speaker: the Teach card and the review overlay both lead with the letters', async () => {
    const speaker = lessonStepsFor('speaker')
    const teachAt = speaker.findIndex((s) => s.id === 'teach-keɖe')

    // A session parked on keɖe's Teach card.
    let releasePath = stubStorage(storedSession('speaker', { lessonIndex: teachAt }))
    const first = await render(<LessonScreen />, { wrapper })
    await releasePath('speaker')
    await act(async () => {
      await flush()
    })
    expect(screen.getByText('New word')).toBeTruthy()
    expect(screen.getByText('Letters to watch')).toBeTruthy()
    await first.unmount()

    // A session in review on keɖe's question, missed in the lesson walk.
    const question = 'activity-q-keɖe'
    releasePath = stubStorage(
      storedSession('speaker', {
        phase: 'review',
        lessonIndex: speaker.length - 1,
        reviewStepIds: [question],
        reviewIndex: 0,
        answers: { [question]: { answer: 'stone', isCorrect: false, supported: false } },
      })
    )
    await render(<LessonScreen />, { wrapper })
    await releasePath('speaker')
    await act(async () => {
      await flush()
    })
    expect(screen.queryByText('Letters to watch')).toBeNull()

    await act(async () => {
      fireEvent.press(screen.getByText('Show the word again'))
      await flush()
    })
    expect(screen.getByText('gloss of keɖe')).toBeTruthy()
    expect(screen.getByText('Letters to watch')).toBeTruthy()
  })
})
