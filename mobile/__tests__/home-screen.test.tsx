/**
 * HomeScreen render-level tests.
 * Verifies meaningful top content is always rendered and WotD error fallback
 * is surfaced when the hook reports an error.
 */
import React from 'react'

import { render, screen } from '@testing-library/react-native'

import HomeScreen from '../src/screens/home'

// --- lingui (post-macro-transform import is @lingui/react) ---
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (d: any) => (typeof d === 'object' ? (d.message ?? d.id ?? '') : String(d)),
  }),
}))

// --- expo-router ---
jest.mock('expo-router', () => {
  const { View } = jest.requireActual('react-native') as any
  const React = jest.requireActual('react') as any
  return {
    Link: ({ children, ...props }: any) => React.createElement(View, props, children),
  }
})

// --- UI primitives ---
jest.mock('../src/components/ui', () => {
  const { View, Text } = jest.requireActual('react-native') as any
  const React = jest.requireActual('react') as any
  return {
    View: ({ children, flex, safeArea, ...props }: any) => React.createElement(View, props, children),
    Text: ({ children, ...props }: any) => React.createElement(Text, props, children),
    Gradient: ({ children, ...props }: any) => React.createElement(View, props, children),
  }
})

// --- icons ---
jest.mock('../src/components/icons', () => ({
  CaretRightIcon: () => null,
  ArticleIcon: () => null,
  BookOpenTextIcon: () => null,
  PlayIcon: () => null,
  SparkleIcon: () => null,
}))

// --- WordOfTheDay stub (keeps fallback/error observable) ---
jest.mock('../src/components/word-of-the-day', () => ({
  WordOfTheDay: (props: any) => {
    const React = jest.requireActual('react') as any
    const { Text } = jest.requireActual('react-native') as any
    if (props.isLoading) return React.createElement(Text, {}, 'WotD loading')
    if (props.isError) return React.createElement(Text, { testID: 'wotd-error-fallback' }, 'WotD unavailable')
    return React.createElement(Text, { testID: 'wotd-content' }, 'WotD content')
  },
}))

// --- mutable hook mocks ---
const mockUseWordOfTheDay = jest.fn()
jest.mock('../src/hooks/use-dictionary', () => ({
  useWordOfTheDay: (...args: any[]) => mockUseWordOfTheDay(...args),
}))

jest.mock('../src/hooks/use-app-data', () => ({
  useAppNextLesson: () => ({ data: null, isLoading: false }),
  useAppProgressSummary: () => ({
    data: { completedLessons: 0, completedUnits: 0, totalLessons: 24, totalUnits: 4, progressPercentage: 0 },
    isLoading: false,
  }),
}))

jest.mock('../src/hooks/use-language', () => ({
  useLanguage: () => ({
    getValue: (obj: any, key: string) => obj?.[key]?.en ?? '',
    currentLanguage: 'en',
  }),
}))

beforeEach(() => {
  mockUseWordOfTheDay.mockReturnValue({ data: [], isLoading: false, isError: false })
})

describe('HomeScreen render', () => {
  it('always renders the Word of the Day section heading', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Word of the Day')).toBeTruthy()
  })

  it('renders new-user CTA when no lesson is available', () => {
    render(<HomeScreen />)
    expect(screen.getByText('Start Learning')).toBeTruthy()
  })

  it('WotD content is shown when hook returns data', () => {
    render(<HomeScreen />)
    expect(screen.getByTestId('wotd-content')).toBeTruthy()
  })

  it('WotD error fallback is shown when useWordOfTheDay returns isError=true', () => {
    mockUseWordOfTheDay.mockReturnValueOnce({ data: [], isLoading: false, isError: true })
    render(<HomeScreen />)
    expect(screen.getByTestId('wotd-error-fallback')).toBeTruthy()
  })
})
