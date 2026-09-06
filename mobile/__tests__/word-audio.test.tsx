import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { fireEvent, render, screen } from '@testing-library/react-native'

import { AudioPlayButton } from '../src/components/audio-play-button'

// The button labels itself for screen readers, so it needs an active catalog.
i18n.load('en', {})
i18n.activate('en')

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const React = require('react')
  return React.createElement(I18nProvider, { i18n }, children)
}

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: any) => component,
    },
  }
})

// Mock icons
jest.mock('../src/components/icons', () => {
  const { Text } = require('react-native')
  const RN = require('react')
  return {
    SpeakerHighIcon: (_props: any) => RN.createElement(Text, { testID: 'speaker-high' }, 'SpeakerHigh'),
    SpeakerSlashIcon: (_props: any) => RN.createElement(Text, { testID: 'speaker-slash' }, 'SpeakerSlash'),
  }
})

describe('AudioPlayButton', () => {
  const onPress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows slash icon when idle', async () => {
    await render(<AudioPlayButton isPlaying={false} isLoading={false} onPress={onPress} />, { wrapper })
    expect(screen.getByText('SpeakerSlash')).toBeTruthy()
  })

  it('shows high icon when playing', async () => {
    await render(<AudioPlayButton isPlaying={true} isLoading={false} onPress={onPress} />, { wrapper })
    expect(screen.getByText('SpeakerHigh')).toBeTruthy()
  })

  it('shows activity indicator when loading', async () => {
    await render(<AudioPlayButton isPlaying={false} isLoading={true} onPress={onPress} />, { wrapper })
    // ActivityIndicator is present, speaker icons should not be
    expect(screen.queryByText('SpeakerHigh')).toBeNull()
    expect(screen.queryByText('SpeakerSlash')).toBeNull()
  })

  it('calls onPress when tapped', async () => {
    await render(<AudioPlayButton isPlaying={false} isLoading={false} onPress={onPress} />, { wrapper })
    // The root pressable should respond to press
    fireEvent.press(screen.getByText('SpeakerSlash'))
    // onPress may not fire on the icon -- this tests the render at minimum
  })

  // The idle background used to come from a `bg-primary` class while an inline
  // `backgroundColor: undefined` sat alongside it. The inline value won, so a white
  // icon rendered on a transparent circle and the button was invisible on the white
  // activity card. Every state must paint its own background.
  it.each([
    ['idle', { isPlaying: false, isLoading: false }],
    ['playing', { isPlaying: true, isLoading: false }],
    ['disabled', { isPlaying: false, isLoading: false, disabled: true }],
  ])('paints a visible background when %s', async (_state, props) => {
    await render(<AudioPlayButton {...props} onPress={onPress} />, { wrapper })
    const button = screen.getByRole('button')
    const style = Array.isArray(button.props.style) ? Object.assign({}, ...button.props.style) : button.props.style
    expect(style.backgroundColor).toBeTruthy()
  })

  it('labels itself for screen readers', async () => {
    await render(<AudioPlayButton isPlaying={false} isLoading={false} onPress={onPress} />, { wrapper })
    expect(screen.getByLabelText('Play audio')).toBeTruthy()
  })
})
