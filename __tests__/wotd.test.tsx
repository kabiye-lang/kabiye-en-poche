import { render, screen } from '@testing-library/react-native'

import { WordOfTheDay } from '../src/components/word-of-the-day'

// Mock @lingui/react (used after macro transformation of useLingui)
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (d: any) => (typeof d === 'object' ? (d.message ?? d.id ?? '') : String(d)),
  }),
}))

// Mock expo-router Link
jest.mock('expo-router', () => {
  const { View } = require('react-native')
  return {
    Link: ({ children, ...props }: any) => {
      const RN = require('react')
      return RN.createElement(View, { testID: 'link', ...props }, children)
    },
  }
})

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: any) => component,
    },
    FadeInUp: {
      duration: () => ({
        delay: () => ({}),
      }),
    },
  }
})

// Mock UI components
jest.mock('../src/components/ui', () => {
  const { View, Text } = require('react-native')
  return {
    Text: ({ children, ...props }: any) => {
      const RN = require('react')
      return RN.createElement(Text, props, children)
    },
    View: ({ children, ...props }: any) => {
      const RN = require('react')
      return RN.createElement(View, props, children)
    },
  }
})

const mockWord = {
  baseHeadword: 'taa',
  entries: [
    {
      entry_id: '1',
      entry_data: {
        headword: 'taa',
        pronunciations: ['taː'],
        letter: 't',
        plural: null,
        variantRefs: [],
        crossRefs: [],
        senses: [
          {
            definitions: [
              {
                definition: 'father',
                grammar: null,
                translations: { fr: 'père', en: 'father' },
              },
            ],
            examples: [],
            lexRefs: [],
          },
        ],
        subEntries: [],
      },
    },
  ],
}

describe('WordOfTheDay', () => {
  it('renders skeleton when loading', () => {
    render(<WordOfTheDay words={[]} language="en" isLoading={true} />)
    // Skeleton has placeholder shapes but no text content
    expect(screen.queryByText('taa')).toBeNull()
  })

  it('renders fallback when words array is empty', () => {
    render(<WordOfTheDay words={[]} language="en" isLoading={false} />)
    // Fallback view renders instead of null so home section stays visible
    expect(screen.getByText('No word available today')).toBeTruthy()
  })

  it('renders fallback when error prop is true', () => {
    render(<WordOfTheDay words={[]} language="en" isLoading={false} isError={true} />)
    expect(screen.getByText('No word available today')).toBeTruthy()
  })

  it('renders word card with headword and translation', () => {
    render(<WordOfTheDay words={[mockWord as any]} language="en" isLoading={false} />)
    expect(screen.getByText('taa')).toBeTruthy()
    expect(screen.getByText('father')).toBeTruthy()
  })
})
