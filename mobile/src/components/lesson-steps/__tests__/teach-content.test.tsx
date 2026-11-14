import { SafeAreaProvider } from 'react-native-safe-area-context'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { render, screen } from '@testing-library/react-native'

import TeachContent from '../teach-content'

i18n.load('en', {})
i18n.activate('en')

// The alphabet table's pronunciation hints; English placeholders, not Kabiyè.
jest.mock('../../../hooks/use-app-data', () => ({
  useAppAlphabetLetters: () => ({
    data: [
      { id: 'ɖ', pronunciation_en: 'hint for ɖ' },
      { id: 'ɛ', pronunciation_en: 'hint for ɛ' },
    ],
  }),
}))

jest.mock('../../../hooks/use-language', () => ({
  useLanguage: () => ({
    currentLanguage: 'en',
    getValue: (obj: Record<string, string> | null, field: string) => obj?.[`${field}_en`] ?? null,
  }),
}))

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider initialMetrics={METRICS}>
    <I18nProvider i18n={i18n}>{children}</I18nProvider>
  </SafeAreaProvider>
)

/** Every text on the card, in render order. */
const texts = () => screen.getAllByText(/.+/).map((node) => [node.props.children].flat().join(''))

describe('TeachContent', () => {
  it('leads with the letters on the speaker path: label and chips before the note', async () => {
    await render(<TeachContent example={{ kbp: 'keɖe', en: 'ripe', note: { en: 'The note.' } }} leadWithLetters />, {
      wrapper,
    })
    const order = texts()
    const label = order.indexOf('Letters to watch')
    expect(label).toBeGreaterThan(order.indexOf('ripe'))
    expect(order.indexOf('ɖ')).toBeGreaterThan(label)
    expect(order.indexOf('hint for ɖ')).toBeLessThan(order.indexOf('The note.'))
  })

  it('keeps the chips after the note, unlabelled, without the lead', async () => {
    await render(<TeachContent example={{ kbp: 'keɖe', en: 'ripe', note: { en: 'The note.' } }} />, { wrapper })
    const order = texts()
    expect(order).not.toContain('Letters to watch')
    expect(order.indexOf('ɖ')).toBeGreaterThan(order.indexOf('The note.'))
  })

  it('shows no label for a word without Kabiyè-only letters', async () => {
    await render(<TeachContent example={{ kbp: 'cee', en: 'tomorrow', note: { en: 'The note.' } }} leadWithLetters />, {
      wrapper,
    })
    expect(screen.queryByText('Letters to watch')).toBeNull()
  })
})
