import type { AudioStatus } from 'expo-audio'

import { act, renderHook } from '@testing-library/react-native'

import { useAudio } from '../use-audio'

// expo-audio is mocked at the module boundary: one player, and a status the test sets
// before each render -- the way `useAudioPlayerStatus` hands the hook native events.
const mockPlayer = {
  replace: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(() => Promise.resolve()),
}
let mockStatus: Partial<AudioStatus> = {}
const mockSetAudioModeAsync = jest.fn((_mode: unknown) => Promise.resolve())

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => mockPlayer,
  useAudioPlayerStatus: () => mockStatus,
  setAudioModeAsync: (mode: unknown) => mockSetAudioModeAsync(mode),
}))

const URL = 'https://isdeilllppdfngxmsols.supabase.co/storage/v1/object/public/audios/keɖe.m4a'

const idle: Partial<AudioStatus> = {
  playing: false,
  isLoaded: false,
  isBuffering: false,
  didJustFinish: false,
  currentTime: 0,
  duration: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockStatus = { ...idle }
})

describe('useAudio', () => {
  // iOS's default `.soloAmbient` category obeys the silent switch, so with the phone on
  // silent nothing was heard. The session must be in playback mode before the clip starts.
  it('sets a silent-mode-proof audio session before the first play', async () => {
    const { result } = await renderHook(() => useAudio())
    await act(() => result.current.playAudio(URL))

    expect(mockSetAudioModeAsync).toHaveBeenCalledWith(expect.objectContaining({ playsInSilentMode: true }))
    expect(mockSetAudioModeAsync.mock.invocationCallOrder[0]).toBeLessThan(mockPlayer.play.mock.invocationCallOrder[0])
  })

  // `play()` returns nothing, so loading used to be cleared the instant it was called.
  it('stays loading until the player reports the clip loaded', async () => {
    const { result, rerender } = await renderHook(() => useAudio())
    expect(result.current.isLoading).toBe(false)

    await act(() => result.current.playAudio(URL))
    expect(result.current.isLoading).toBe(true)

    mockStatus = { ...idle, isLoaded: true, playing: true }
    await rerender({})
    expect(result.current.isLoading).toBe(false)
  })

  it('shows loading while the player buffers', async () => {
    const { result, rerender } = await renderHook(() => useAudio())
    await act(() => result.current.playAudio(URL))
    mockStatus = { ...idle, isLoaded: true, isBuffering: true }
    await rerender({})
    expect(result.current.isLoading).toBe(true)
  })

  // iOS pauses at the end of a clip and leaves the position there. Replay used to work
  // only because the cleanup effect rewound on every `playing` flip.
  it('rewinds a finished clip before playing it again', async () => {
    const { result, rerender } = await renderHook(() => useAudio())
    await act(() => result.current.playAudio(URL))
    mockStatus = { ...idle, isLoaded: true, playing: true, duration: 0.8, currentTime: 0.2 }
    await rerender({})
    mockStatus = { ...idle, isLoaded: true, playing: false, duration: 0.8, currentTime: 0.79 }
    await rerender({})

    jest.clearAllMocks()
    await act(() => result.current.playAudio(URL))

    expect(mockPlayer.replace).not.toHaveBeenCalled()
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0)
    expect(mockPlayer.seekTo.mock.invocationCallOrder[0]).toBeLessThan(mockPlayer.play.mock.invocationCallOrder[0])
  })

  it('resumes a clip stopped midway without rewinding it', async () => {
    const { result, rerender } = await renderHook(() => useAudio())
    await act(() => result.current.playAudio(URL))
    mockStatus = { ...idle, isLoaded: true, playing: false, duration: 3, currentTime: 1 }
    await rerender({})

    jest.clearAllMocks()
    await act(() => result.current.playAudio(URL))
    expect(mockPlayer.seekTo).not.toHaveBeenCalled()
    expect(mockPlayer.play).toHaveBeenCalled()
  })

  // The old cleanup depended on `status.playing`, so it paused and rewound the player
  // each time playback started or stopped, not only when the screen went away.
  it('does not pause or rewind when playback merely starts and stops', async () => {
    const { result, rerender, unmount } = await renderHook(() => useAudio())
    await act(() => result.current.playAudio(URL))
    mockStatus = { ...idle, isLoaded: true, playing: true, duration: 0.8 }
    await rerender({})
    mockStatus = { ...idle, isLoaded: true, playing: false, duration: 0.8, currentTime: 0.8, didJustFinish: true }
    await rerender({})

    expect(mockPlayer.pause).not.toHaveBeenCalled()
    expect(mockPlayer.seekTo).not.toHaveBeenCalled()

    await unmount()
    expect(mockPlayer.pause).toHaveBeenCalledTimes(1)
  })
})
