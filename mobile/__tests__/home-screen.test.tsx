/**
 * HomeScreen render-level tests, rewritten for the Laterite direction.
 *
 * The previous version asserted the old screen: a "Word of the Day" heading, a "Start
 * Learning" call to action, and a stubbed WordOfTheDay component. Home no longer opens
 * on a to-do card -- it opens on the letter of the week, and the word of the day is a
 * quiet band under a rule. These assertions describe that.
 */
import React from 'react'

import { render, screen } from '@testing-library/react-native'

import HomeScreen, { letterOfTheWeek } from '../src/screens/home'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (d: any) => (typeof d === 'object' ? (d.message ?? d.id ?? '') : String(d)),
  }),
}))

jest.mock('expo-router', () => {
  const { View } = jest.requireActual('react-native') as any
  const React = jest.requireActual('react') as any
  return {
    Link: ({ children, ...props }: any) => React.createElement(View, props, children),
    router: { push: jest.fn() },
  }
})

jest.mock('../src/components/ui', () => {
  const { View, Text } = jest.requireActual('react-native') as any
  const React = jest.requireActual('react') as any
  return {
    View: ({ children, flex, safeArea, ...props }: any) => React.createElement(View, props, children),
    Text: ({ children, kabiye, weight, ...props }: any) => React.createElement(Text, props, children),
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

jest.mock('../src/hooks/use-dictionary', () => ({
  useWordOfTheDay: (...args: any[]) => mockUseWordOfTheDay(...args),
}))

jest.mock('../src/hooks/use-app-data', () => ({
  useAppNextLesson: () => mockUseAppNextLesson(),
  useAppAlphabetLetters: () => mockUseAppAlphabetLetters(),
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

beforeEach(() => {
  jest.clearAllMocks()
  mockUseWordOfTheDay.mockReturnValue({ data: [], isLoading: false, isError: false })
  mockUseAppNextLesson.mockReturnValue({ data: null })
  mockUseAppAlphabetLetters.mockReturnValue({ data: [] })
})

describe('HomeScreen', () => {
  it('opens on the letter of the week, not on a to-do card', async () => {
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

  it('offers the next lesson when there is one', async () => {
    mockUseAppNextLesson.mockReturnValue({ data: { id: 'l1', title_en: 'Greetings' } })
    await render(<HomeScreen />)
    expect(screen.getByText('Greetings')).toBeTruthy()
  })

  it('still renders without a next lesson', async () => {
    await render(<HomeScreen />)
    expect(screen.getByText('Alphabet')).toBeTruthy()
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
