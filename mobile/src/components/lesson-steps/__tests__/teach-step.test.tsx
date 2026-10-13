import { SafeAreaProvider } from 'react-native-safe-area-context'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render } from '@testing-library/react-native'

import TeachStep from '../teach-step'

i18n.load('en', {})
i18n.activate('en')

const mockStopAudio = jest.fn(() => Promise.resolve())

jest.mock('../../../hooks/use-audio', () => ({
  useAudio: () => ({
    playAudio: jest.fn(),
    stopAudio: mockStopAudio,
    isPlaying: true,
    isLoading: false,
    error: null,
  }),
}))

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))

// The card's word, gloss and play button are not under test here.
jest.mock('../teach-content', () => () => null)
jest.mock('../../audio-play-button', () => ({ AudioPlayButton: () => null }))

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={METRICS}>
    <I18nProvider i18n={i18n}>{children}</I18nProvider>
  </SafeAreaProvider>
)

const KEDE = { kbp: 'keɖe', en: 'ripe', lexeme_id: 'keɖe#1' }
const WIU = { kbp: 'wɩʋ', en: 'stone', lexeme_id: 'wɩʋ' }
const URL_A = 'https://example.test/audios/a.m4a'
const URL_B = 'https://example.test/audios/b.m4a'

beforeEach(() => jest.clearAllMocks())

describe('TeachStep', () => {
  // Review round 2 (P3): a card handed a new word kept playing the old one over it.
  it('stops the playing clip when the card is handed a different word', async () => {
    const { rerender } = await render(<TeachStep example={KEDE} audioUrl={URL_A} onContinue={() => {}} />, {
      wrapper,
    })
    expect(mockStopAudio).not.toHaveBeenCalled()

    await rerender(<TeachStep example={WIU} audioUrl={URL_B} onContinue={() => {}} />)
    expect(mockStopAudio).toHaveBeenCalledTimes(1)
  })

  it('leaves the clip alone when the card re-renders with the same word', async () => {
    const { rerender } = await render(<TeachStep example={KEDE} audioUrl={URL_A} onContinue={() => {}} />, {
      wrapper,
    })
    await rerender(<TeachStep example={{ ...KEDE }} audioUrl={URL_A} onContinue={() => {}} />)
    expect(mockStopAudio).not.toHaveBeenCalled()
  })
})
