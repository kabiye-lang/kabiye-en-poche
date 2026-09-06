import { hasUsableAudio, usableAudioUrl } from '../src/utils/audio-source'

// babel-plugin-jest-hoist lifts this above the import. The trusted origin is read
// from expo config at import time, so pin it here rather than depending on which
// .env file happens to be loaded.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supabase: { url: 'https://isdeilllppdfngxmsols.supabase.co' } } } },
}))

const HOSTED = 'https://isdeilllppdfngxmsols.supabase.co/storage/v1/object/public/audios/a.wav'
const PLACEHOLDER = 'https://audio-samples.github.io/samples/mp3/multiscale/5tier/sample-0.mp3'

describe('usableAudioUrl', () => {
  it('accepts recordings served from our own storage', () => {
    expect(usableAudioUrl(HOSTED)).toBe(HOSTED)
  })

  it('rejects the stock placeholder that shipped on every example', () => {
    expect(usableAudioUrl(PLACEHOLDER)).toBeUndefined()
  })

  it('rejects any other third-party host', () => {
    expect(usableAudioUrl('https://example.com/afa.mp3')).toBeUndefined()
  })

  it('treats missing and malformed URLs as absent', () => {
    expect(usableAudioUrl(undefined)).toBeUndefined()
    expect(usableAudioUrl(null)).toBeUndefined()
    expect(usableAudioUrl('')).toBeUndefined()
    expect(usableAudioUrl('not a url')).toBeUndefined()
  })
})

describe('hasUsableAudio', () => {
  it('is false when every entry is a placeholder', () => {
    expect(hasUsableAudio([PLACEHOLDER, PLACEHOLDER, undefined])).toBe(false)
  })

  it('is true as soon as one entry is hosted', () => {
    expect(hasUsableAudio([PLACEHOLDER, HOSTED])).toBe(true)
  })

  it('is false for an empty list', () => {
    expect(hasUsableAudio([])).toBe(false)
  })
})
