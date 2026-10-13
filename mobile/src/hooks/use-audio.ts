import { useEffect, useRef, useState } from 'react'

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'

import { configureAudioSession } from '../utils/audio-session'

/**
 * How close to the end a clip must sit to count as finished. iOS pauses at the end of an
 * item (`actionAtItemEnd = .pause`) and reports a position a few milliseconds short of
 * the duration, so an exact comparison misses it.
 */
const END_TOLERANCE_SECONDS = 0.1

export const useAudio = () => {
  const player = useAudioPlayer()
  const status = useAudioPlayerStatus(player)
  // Whether playback was ever asked for. A player with no source reports `isLoaded: false`
  // too, and the button disables itself while loading -- so without this it would sit
  // disabled before the first tap.
  const [requested, setRequested] = useState(false)
  const currentSourceRef = useRef<string | null>(null)

  // Stop on unmount only. This used to depend on `status.playing` as well, so its cleanup
  // ran -- pausing and rewinding -- every time playback started or stopped. Replay worked
  // only by that accident; it is now explicit in `playAudio`.
  useEffect(
    function pauseOnUnmount() {
      return () => {
        try {
          player.pause()
        } catch {
          // The player may already be released.
        }
      }
    },
    [player]
  )

  const playAudio = async (audioUri: string) => {
    try {
      setRequested(true)
      await configureAudioSession()

      if (currentSourceRef.current !== audioUri) {
        player.replace({ uri: audioUri })
        currentSourceRef.current = audioUri
      } else {
        // The same clip again. At its end iOS leaves the position at the end, and `play()`
        // from there plays nothing -- rewind first.
        const atEnd =
          status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration - END_TOLERANCE_SECONDS)
        if (atEnd) await player.seekTo(0)
      }

      player.play()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const stopAudio = async () => {
    try {
      if (status.playing) {
        player.pause()
        await player.seekTo(0) // Reset to beginning
      }
    } catch (error) {
      console.error('Error stopping audio:', error)
    }
  }

  const pauseAudio = async () => {
    try {
      if (status.playing) {
        player.pause()
      }
    } catch (error) {
      console.error('Error pausing audio:', error)
    }
  }

  const resumeAudio = async () => {
    try {
      if (!status.playing) {
        player.play()
      }
    } catch (error) {
      console.error('Error resuming audio:', error)
    }
  }

  return {
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    isPlaying: status.playing,
    // `play()` returns nothing to await, so loading is read from the player: the source is
    // not loaded yet after `replace`, or the player is buffering.
    isLoading: requested && !status.error && (!status.isLoaded || status.isBuffering),
    // A URL can point at a recording that no longer exists in storage. Without
    // this the control just silently does nothing when tapped; callers use it to
    // say so instead.
    error: status.error ?? null,
  }
}
