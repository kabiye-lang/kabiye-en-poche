import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render, screen } from '@testing-library/react-native'

import { CrossReferences, SenseDefinitions, SubEntries } from '../src/components/word/word-sections'

// Activate a minimal lingui catalog for tests
i18n.load('en', {})
i18n.activate('en')

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const React = require('react')
  return React.createElement(I18nProvider, { i18n }, children)
}

// Mock expo-router Link
jest.mock('expo-router', () => {
  const { View } = require('react-native')
  const RN = require('react')
  return {
    Link: ({ children, ...props }: any) => RN.createElement(View, { testID: 'link', ...props }, children),
  }
})

// Mock UI components
jest.mock('../src/components/ui', () => {
  const { View, Text } = require('react-native')
  const RN = require('react')
  return {
    Card: ({ children, ...props }: any) => RN.createElement(View, { testID: 'card', ...props }, children),
    Text: ({ children, ...props }: any) => RN.createElement(Text, props, children),
    View: ({ children, ...props }: any) => RN.createElement(View, props, children),
  }
})

// Mock icons
jest.mock('../src/components/icons', () => {
  const { Text } = require('react-native')
  const RN = require('react')
  return {
    ArrowRightIcon: (props: any) => RN.createElement(Text, {}, '→'),
  }
})

describe('Word empty state — SenseDefinitions', () => {
  it('renders nothing when senses are empty', () => {
    const { toJSON } = render(<SenseDefinitions senses={[]} translation="en" />, { wrapper })
    expect(toJSON()).toBeNull()
  })

  it('renders definitions when senses are provided', () => {
    const senses = [
      {
        senseNumber: 1,
        definitions: [
          {
            definition: 'test',
            grammar: undefined,
            translations: { fr: 'test-fr', en: 'test-en' },
          },
        ],
        examples: [],
        lexRefs: [],
      },
    ]
    render(<SenseDefinitions senses={senses} translation="en" />, { wrapper })
    expect(screen.getByText(/test-en/)).toBeTruthy()
  })
})

describe('Word empty state — CrossReferences', () => {
  it('renders nothing when cross refs are empty', () => {
    const { toJSON } = render(<CrossReferences crossRefs={[]} />, { wrapper })
    expect(toJSON()).toBeNull()
  })
})

describe('Word empty state — SubEntries', () => {
  it('renders nothing when sub entries are empty', () => {
    const { toJSON } = render(<SubEntries subEntries={[]} translation="en" />, { wrapper })
    expect(toJSON()).toBeNull()
  })
})
