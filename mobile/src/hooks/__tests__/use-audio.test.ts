import type { AudioStatus } from 'expo-audio'

import { act, renderHook } from '@testing-library/react-native'

import * as audioSession from '../../utils/audio-session'
import { LOAD_TIMEOUT_MS, useAudio } from '../use-audio'

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
  jest.restoreAllMocks()
  mockStatus = { ...idle }
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
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

  // Review P2: a throw from replace() left `requested` set and the source unloaded, so
  // the button spun -- and stayed disabled -- for good.
  it('stops loading and reports the error when replace throws, and loads again on the next tap', async () => {
    mockPlayer.replace.mockImplementationOnce(() => {
      throw new Error('cannot be cast to AudioSource')
    })
    const { result } = await renderHook(() => useAudio())

    await act(() => result.current.playAudio(URL))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('cannot be cast to AudioSource')
    expect(mockPlayer.play).not.toHaveBeenCalled()

    await act(() => result.current.playAudio(URL))
    expect(mockPlayer.replace).toHaveBeenCalledTimes(2)
    expect(mockPlayer.play).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it('stops loading on a native failure, and loads the source again on the next tap', async () => {
    const { result, rerender } = await renderHook(() => useAudio())
    await act(() => result.current.playAudio(URL))
    mockStatus = { ...idle, isLoaded: false, error: 'decode failed' } as Partial<AudioStatus>
    await rerender({})

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('decode failed')

    jest.clearAllMocks()
    await act(() => result.current.playAudio(URL))
    expect(mockPlayer.replace).toHaveBeenCalledWith({ uri: URL })
  })

  // Review P2: the session must be tried again before a play, and its failure must not
  // stop the clip.
  it('still plays when the audio mode cannot be set, and tries the mode again next time', async () => {
    const configure = jest
      .spyOn(audioSession, 'configureAudioSession')
      .mockRejectedValueOnce(new Error('session busy'))
      .mockResolvedValueOnce(undefined)
    const { result } = await renderHook(() => useAudio())

    await act(() => result.current.playAudio(URL))
    expect(mockPlayer.play).toHaveBeenCalledTimes(1)

    await act(() => result.current.playAudio(URL))
    expect(configure).toHaveBeenCalledTimes(2)
  })

  // Review round 2 (P2): a missing file can leave the player at `isLoaded: false` with no
  // `status.error`. The spinner -- a disabled button -- must not last for ever.
  describe('load timeout', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('gives up on a clip that never loads, says so, and lets the next tap load it again', async () => {
      const { result } = await renderHook(() => useAudio())
      await act(() => result.current.playAudio(URL))
      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        jest.advanceTimersByTime(LOAD_TIMEOUT_MS)
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toEqual(expect.any(String))
      expect(mockPlayer.pause).toHaveBeenCalled()

      jest.clearAllMocks()
      await act(() => result.current.playAudio(URL))
      expect(mockPlayer.replace).toHaveBeenCalledWith({ uri: URL })
      expect(result.current.error).toBeNull()
    })

    it('does not time out a clip that loaded in time', async () => {
      const { result, rerender } = await renderHook(() => useAudio())
      await act(() => result.current.playAudio(URL))
      mockStatus = { ...idle, isLoaded: true, playing: true, duration: 30 }
      await rerender({})

      await act(async () => {
        jest.advanceTimersByTime(LOAD_TIMEOUT_MS * 2)
      })
      expect(result.current.error).toBeNull()
      expect(mockPlayer.pause).not.toHaveBeenCalled()
    })
  })

  // Final review (P2): the play went on after its `await` whatever happened meanwhile. A
  // slow audio-mode setup started the clip after the UI had reported failure, or after the
  // learner had stopped it or left the step.
  describe('a play still waiting on the audio-mode setup', () => {
    let resolveSetup: () => void
    beforeEach(() => {
      jest.spyOn(audioSession, 'configureAudioSession').mockReturnValueOnce(
        new Promise<void>((resolve) => {
          resolveSetup = resolve
        })
      )
    })

    it('never starts once the load has timed out', async () => {
      jest.useFakeTimers()
      try {
        const { result } = await renderHook(() => useAudio())
        let pending!: Promise<void>
        await act(async () => {
          pending = result.current.playAudio(URL)
        })
        await act(async () => {
          jest.advanceTimersByTime(LOAD_TIMEOUT_MS)
        })
        expect(result.current.error).toEqual(expect.any(String))

        await act(async () => {
          resolveSetup()
          await pending
        })
        expect(mockPlayer.replace).not.toHaveBeenCalled()
        expect(mockPlayer.play).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
    })

    it('never starts once it has been stopped, and stops loading', async () => {
      const { result } = await renderHook(() => useAudio())
      let pending!: Promise<void>
      await act(async () => {
        pending = result.current.playAudio(URL)
      })
      await act(() => result.current.stopAudio())
      expect(result.current.isLoading).toBe(false)

      await act(async () => {
        resolveSetup()
        await pending
      })
      expect(mockPlayer.replace).not.toHaveBeenCalled()
      expect(mockPlayer.play).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })

    it('never touches the player once the hook has unmounted', async () => {
      const { result, unmount } = await renderHook(() => useAudio())
      let pending!: Promise<void>
      await act(async () => {
        pending = result.current.playAudio(URL)
      })
      await unmount()

      resolveSetup()
      await pending
      expect(mockPlayer.replace).not.toHaveBeenCalled()
      expect(mockPlayer.play).not.toHaveBeenCalled()
      expect(mockPlayer.seekTo).not.toHaveBeenCalled()
    })
  })

  // Review round 2 (P3): the Teach card stops the clip from an effect, where `status` can
  // be a render behind and still read `playing: false`. Stopping must not depend on it.
  it('stops even when the status it holds does not yet say playing', async () => {
    const { result } = await renderHook(() => useAudio())
    await act(() => result.current.playAudio(URL))

    await act(() => result.current.stopAudio())
    expect(mockPlayer.pause).toHaveBeenCalled()
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(0)
  })

  // Found in the simulator: the listening steps stop the clip from their unmount cleanup,
  // which runs after expo-audio has released the player. Pausing a released player throws,
  // and the now-unconditional stop logged it as an error on every step change.
  it('does nothing, and logs nothing, when stopped after the player is gone', async () => {
    const { result, unmount } = await renderHook(() => useAudio())
    const { stopAudio } = result.current
    await unmount()
    mockPlayer.pause.mockImplementationOnce(() => {
      throw new Error('ERR_NATIVE_SHARED_OBJECT_NOT_FOUND')
    })

    await act(() => stopAudio())
    expect(console.error).not.toHaveBeenCalled()
  })
})
