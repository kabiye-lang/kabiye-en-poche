/**
 * OnboardingScreen render-level tests.
 * Verifies slides contain visible title / description / controls — not just
 * a mirrored data-structure check.
 */
import React from 'react'

import { render, screen } from '@testing-library/react-native'

import OnboardingScreen from '../src/app/(onboarding)/index'

// --- lingui ---
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (d: any) => (typeof d === 'object' ? (d.message ?? d.id ?? '') : String(d)),
  }),
}))

// --- expo-router ---
jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}))

// --- AsyncStorage (uses __mocks__ file automatically) ---
jest.mock('@react-native-async-storage/async-storage')

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

describe('OnboardingScreen render', () => {
  it('renders the first slide title text', () => {
    render(<OnboardingScreen />)
    expect(screen.getByText('Discover Kabiyè')).toBeTruthy()
  })

  it('renders the first slide description text', () => {
    render(<OnboardingScreen />)
    expect(
      screen.getByText(
        'Explore a rich West African language spoken by millions. Learn words, phrases, and the beautiful Kabiyè alphabet.'
      )
    ).toBeTruthy()
  })

  it('shows Next button on the first slide', () => {
    render(<OnboardingScreen />)
    expect(screen.getByText('Next')).toBeTruthy()
  })

  it('shows Skip button on the first slide', () => {
    render(<OnboardingScreen />)
    expect(screen.getByText('Skip')).toBeTruthy()
  })

  it('does not show Get Started on the first slide', () => {
    render(<OnboardingScreen />)
    expect(screen.queryByText('Get Started')).toBeNull()
  })
})
