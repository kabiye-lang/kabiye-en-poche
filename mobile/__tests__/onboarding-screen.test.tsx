/**
 * OnboardingScreen render-level tests, rewritten for the Laterite direction.
 *
 * Onboarding used to be three emoji slides describing the app. It is now one question
 * whose answer reorders the curriculum, so what matters is that the three answers are
 * offered, that choosing one is required before continuing, and that the choice is
 * actually stored -- an onboarding that forgets is worse than none.
 */
import React from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import OnboardingScreen from '../src/app/(onboarding)/index'
import { PATH_STORAGE_KEY } from '../src/hooks/use-path'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (d: any) => (typeof d === 'object' ? (d.message ?? d.id ?? '') : String(d)),
  }),
}))

const mockReplace = jest.fn()
jest.mock('expo-router', () => ({
  router: { replace: (...args: any[]) => mockReplace(...args) },
}))

jest.mock('@react-native-async-storage/async-storage')

jest.mock('../src/components/ui', () => {
  const { View, Text, Pressable } = jest.requireActual('react-native') as any
  const React = jest.requireActual('react') as any
  return {
    View: ({ children, flex, safeArea, ...props }: any) => React.createElement(View, props, children),
    Text: ({ children, kabiye, weight, ...props }: any) => React.createElement(Text, props, children),
    // The real Button wraps its label in a Text; the mock must too, or the renderer
    // rejects a bare string inside a Pressable.
    Button: ({ children, onPress, disabled, fullWidth, variant, ...props }: any) =>
      React.createElement(
        Pressable,
        { onPress, disabled, accessibilityState: { disabled }, ...props },
        React.createElement(Text, {}, children)
      ),
  }
})

jest.mock('../src/components/icons', () => ({
  CheckCircleIcon: () => null,
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('OnboardingScreen', () => {
  it('asks the one question it exists to ask', async () => {
    await render(<OnboardingScreen />)
    expect(screen.getByText('Where does Kabiyè sit in your life?')).toBeTruthy()
  })

  it('offers all three audiences the product serves', async () => {
    await render(<OnboardingScreen />)
    expect(screen.getByText('I speak it. I want to write it.')).toBeTruthy()
    expect(screen.getByText('I grew up hearing it.')).toBeTruthy()
    expect(screen.getByText("I'm new to it.")).toBeTruthy()
  })

  it('says what each answer will change', async () => {
    await render(<OnboardingScreen />)
    expect(screen.getByText('Start with the alphabet and spelling.')).toBeTruthy()
    expect(screen.getByText('Start with greetings.')).toBeTruthy()
  })

  it('will not continue until an answer is chosen', async () => {
    await render(<OnboardingScreen />)
    fireEvent.press(screen.getByText('Continue'))
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('stores the chosen path, so the choice survives the screen', async () => {
    await render(<OnboardingScreen />)
    // Press the option itself rather than the label nested inside it, and let the
    // selection flush before pressing Continue -- rendering is async here, so pressing
    // both in the same tick reads a Continue that is still disabled.
    fireEvent.press(screen.getByLabelText(/I speak it/))
    await waitFor(() => expect(screen.getByLabelText(/I speak it/).props.accessibilityState.selected).toBe(true))

    fireEvent.press(screen.getByText('Continue'))
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith(PATH_STORAGE_KEY, 'speaker'))
  })

  it('lets a learner skip without inventing a path for them', async () => {
    await render(<OnboardingScreen />)
    fireEvent.press(screen.getByText('Skip'))
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(PATH_STORAGE_KEY, expect.anything())
  })

  it('marks onboarding done either way, so it is asked once', async () => {
    await render(<OnboardingScreen />)
    fireEvent.press(screen.getByText('Skip'))
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith('@kabiye_onboarding_complete', 'true'))
  })
})
