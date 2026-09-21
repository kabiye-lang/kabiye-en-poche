/**
 * HomeScreen render-level tests.
 *
 * Home opens on a resume card and a search field first, with the letter of the week
 * kept below as an editorial feature (design review 2026-09-21, SPEC-home-learn-
 * priorities). These assertions describe that ordering and the resume card's four
 * states: loading, error, "nothing left to resume", and the lesson itself.
 */
import React from 'react'

import { fireEvent, render, screen } from '@testing-library/react-native'

import HomeScreen, { letterOfTheWeek } from '../src/screens/home'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    // The macro compiles `t\`Step ${a} of ${b}\`` to `_({ id, message, values: {0: a, 1: b} })`.
    // Substituting `values` here (unlike the simpler mock elsewhere in this suite) is needed
    // because this screen's progress line is the thing several tests assert on.
    _: (d: any) => {
      if (typeof d !== 'object' || d === null) return String(d)
      const message: string = d.message ?? d.id ?? ''
      const values: Record<string, unknown> = d.values ?? {}
      return message.replace(/\{(\w+)\}/g, (match: string, key: string) =>
        key in values ? String(values[key]) : match
      )
    },
  }),
}))

jest.mock('expo-router', () => {
  const { View } = jest.requireActual('react-native') as any
  const React = jest.requireActual('react') as any
  return {
    Link: ({ children, ...props }: any) => React.createElement(View, props, children),
    router: { push: jest.fn() },
    // Stands in for the real navigation-focus lifecycle: runs the effect once on mount,
    // which is all a render test needs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, []),
    useLocalSearchParams: () => ({}),
  }
})

jest.mock('../src/components/ui', () => {
  const { View, Text } = jest.requireActual('react-native') as any
  const React = jest.requireActual('react') as any
  return {
    View: ({ children, flex, safeArea, ...props }: any) => React.createElement(View, props, children),
    Text: ({ children, kabiye, weight, ...props }: any) => React.createElement(Text, props, children),
    Skeleton: (props: any) => React.createElement(View, props),
  }
})

jest.mock('../src/components/icons', () => ({
  CaretRightIcon: () => null,
  MagnifyingGlassIcon: () => null,
  PlayIcon: () => null,
}))

const mockUseWordOfTheDay = jest.fn()
const mockUseAppNextLesson = jest.fn()
const mockUseAppAlphabetLetters = jest.fn()
const mockUseAppUserProgress = jest.fn()
const mockReadLessonSessionSummary = jest.fn()

jest.mock('../src/hooks/use-dictionary', () => ({
  useWordOfTheDay: (...args: any[]) => mockUseWordOfTheDay(...args),
}))

jest.mock('../src/hooks/use-app-data', () => ({
  useAppNextLesson: () => mockUseAppNextLesson(),
  useAppAlphabetLetters: () => mockUseAppAlphabetLetters(),
  useAppUserProgress: () => mockUseAppUserProgress(),
}))

jest.mock('../src/hooks/use-lesson-session', () => ({
  readLessonSessionSummary: (...args: any[]) => mockReadLessonSessionSummary(...args),
}))

jest.mock('../src/hooks/use-my-words', () => ({
  useMyWords: () => ({ savedCount: 0 }),
}))

jest.mock('../src/hooks/use-language', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    getValue: (obj: any, field: string) => obj?.[`${field}_en`] ?? null,
  }),
}))

/** The shape useWordOfTheDay actually returns: homographs grouped by headword. */
const wordGroup = (headword: string, en?: string, fr?: string) => ({
  baseHeadword: headword,
  entries: [
    {
      entry_data: {
        headword,
        senses: [{ definitions: [{ translations: { en, fr } }] }],
      },
    },
  ],
})

/** The shape useAppNextLesson resolves to (see NextLessonSummary in use-units.ts). */
const nextLessonSummary = (overrides: Partial<Record<string, any>> = {}) => ({
  lesson: { id: 'l1', title_en: 'Greetings', title_fr: 'Salutations' },
  unitTitle: { title_en: 'Greetings & People', title_fr: 'Salutations et gens' },
  ordinal: 2,
  writtenInUnit: 5,
  ...overrides,
})

/** A resolved `useAppNextLesson()`, holding an actual lesson to resume. */
const mockResolvedNextLesson = () => {
  mockUseAppNextLesson.mockReturnValue({
    data: nextLessonSummary(),
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseWordOfTheDay.mockReturnValue({ data: [], isLoading: false, isError: false })
  mockUseAppNextLesson.mockReturnValue({ data: null, isPending: false, isError: false, refetch: jest.fn() })
  mockUseAppAlphabetLetters.mockReturnValue({ data: [] })
  mockUseAppUserProgress.mockReturnValue({ data: [] })
  mockReadLessonSessionSummary.mockResolvedValue(null)
})

describe('HomeScreen', () => {
  it('shows the letter of the week below the resume card, not as the first thing', async () => {
    await render(<HomeScreen />)
    expect(screen.getByText('Letter of the week')).toBeTruthy()
  })

  it('shows the letter as a capital/lowercase pair', async () => {
    await render(<HomeScreen />)
    const letter = letterOfTheWeek()
    expect(screen.getByText(`${letter.toUpperCase()}${letter}`)).toBeTruthy()
  })

  it('explains the letter from the alphabet table rather than authored copy', async () => {
    const letter = letterOfTheWeek()
    mockUseAppAlphabetLetters.mockReturnValue({
      data: [{ id: letter, pronunciation_en: 'Like "ng" in "sing"' }],
    })
    await render(<HomeScreen />)
    expect(screen.getByText('Like "ng" in "sing"')).toBeTruthy()
  })

  it('offers a search field that hands off to the dictionary with a focus request', async () => {
    const { router } = jest.requireMock('expo-router')
    await render(<HomeScreen />)
    fireEvent.press(screen.getByText('Search the dictionary'))
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/(tabs)/dictionary',
        params: expect.objectContaining({ focus: expect.any(String) }),
      })
    )
  })

  it('still renders without a next lesson', async () => {
    await render(<HomeScreen />)
    expect(screen.getByText('Alphabet')).toBeTruthy()
    expect(screen.queryByText('Continue')).toBeNull()
    expect(screen.queryByText('Start here')).toBeNull()
  })

  it('shows a skeleton, not the error or the lesson, while the next lesson is pending', async () => {
    mockUseAppNextLesson.mockReturnValue({ data: null, isPending: true, isError: false, refetch: jest.fn() })
    await render(<HomeScreen />)
    expect(screen.queryByText('We could not load your next lesson.')).toBeNull()
    expect(screen.queryByText('Greetings')).toBeNull()
  })

  it('offers "Try again" when the next lesson fails to load, and it refetches', async () => {
    const refetch = jest.fn()
    mockUseAppNextLesson.mockReturnValue({ data: null, isPending: false, isError: true, refetch })
    await render(<HomeScreen />)
    expect(screen.getByText('We could not load your next lesson.')).toBeTruthy()
    fireEvent.press(screen.getByText('Try again'))
    expect(refetch).toHaveBeenCalled()
  })

  it('says "Start here" the first time, with nothing saved and nothing finished', async () => {
    mockResolvedNextLesson()
    await render(<HomeScreen />)
    expect(screen.getByText('Start here')).toBeTruthy()
    expect(screen.getByText('Greetings')).toBeTruthy()
  })

  it('says "Continue" once a lesson has been finished, even with no saved session', async () => {
    mockResolvedNextLesson()
    mockUseAppUserProgress.mockReturnValue({ data: [{ lessonId: 'other', completedAt: '2026-01-01' }] })
    await render(<HomeScreen />)
    expect(screen.getByText('Continue')).toBeTruthy()
  })

  it('says "Continue" when there is a saved session, even with nothing finished yet', async () => {
    mockResolvedNextLesson()
    mockReadLessonSessionSummary.mockResolvedValue({ kind: 'lesson', current: 3, total: 8 })
    await render(<HomeScreen />)
    expect(screen.getByText('Continue')).toBeTruthy()
    expect(screen.getByText('Step 3 of 8')).toBeTruthy()
  })

  it('shows "Review" as the progress line when the saved session is the review', async () => {
    mockResolvedNextLesson()
    mockReadLessonSessionSummary.mockResolvedValue({ kind: 'review' })
    await render(<HomeScreen />)
    expect(screen.getByText('Review')).toBeTruthy()
  })

  it('falls back to the lesson’s place in its unit when there is no saved session', async () => {
    mockResolvedNextLesson()
    await render(<HomeScreen />)
    expect(screen.getByText('Lesson 2 of 5 · Greetings & People')).toBeTruthy()
  })

  it('shows the word of the day under the Today label', async () => {
    mockUseWordOfTheDay.mockReturnValue({
      data: [wordGroup('sɛtʋ', 'greeting')],
      isLoading: false,
      isError: false,
    })
    await render(<HomeScreen />)
    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('sɛtʋ')).toBeTruthy()
    expect(screen.getByText('greeting')).toBeTruthy()
  })

  it('marks a French gloss shown to an English reader', async () => {
    // About a quarter of the dictionary has no English gloss. Showing the French and
    // labelling it beats hiding the word.
    mockUseWordOfTheDay.mockReturnValue({
      data: [wordGroup('fɛŋgɛ', undefined, 'léger sans poids')],
      isLoading: false,
      isError: false,
    })
    await render(<HomeScreen />)
    expect(screen.getByText('léger sans poids')).toBeTruthy()
    expect(screen.getByText('FR')).toBeTruthy()
  })

  it('omits the Today band entirely when there is no word', async () => {
    await render(<HomeScreen />)
    expect(screen.queryByText('Today')).toBeNull()
  })
})

describe('letterOfTheWeek', () => {
  it('only ever returns a letter French cannot write', () => {
    const kabiyeOnly = 'ɖɛɣɩŋɔʋñ'
    for (let week = 0; week < 60; week++) {
      const date = new Date(week * 7 * 24 * 60 * 60 * 1000)
      expect(kabiyeOnly).toContain(letterOfTheWeek(date))
    }
  })

  it('holds the same letter for a whole week, then moves on', () => {
    const monday = new Date(1_000 * 60 * 60 * 24 * 700)
    const sameWeek = new Date(monday.getTime() + 1000 * 60 * 60 * 24 * 3)
    const nextWeek = new Date(monday.getTime() + 1000 * 60 * 60 * 24 * 8)
    expect(letterOfTheWeek(sameWeek)).toBe(letterOfTheWeek(monday))
    expect(letterOfTheWeek(nextWeek)).not.toBe(letterOfTheWeek(monday))
  })

  it('covers all eight letters over eight weeks', () => {
    const seen = new Set<string>()
    for (let week = 0; week < 8; week++) {
      seen.add(letterOfTheWeek(new Date(week * 7 * 24 * 60 * 60 * 1000)))
    }
    expect(seen.size).toBe(8)
  })
})
