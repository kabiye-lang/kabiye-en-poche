import { useEffect, useRef, useState } from 'react'

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'

export const useAudio = () => {
  const player = useAudioPlayer()
  const status = useAudioPlayerStatus(player)
  const [isLoading, setIsLoading] = useState(false)
  const currentSourceRef = useRef<string | null>(null)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      // Stop and reset audio if playing
      if (player && status.playing) {
        try {
          player.pause()
          player.seekTo(0)
        } catch {
          // Ignore errors during cleanup
        }
      }
    }
  }, [player, status.playing])

  const playAudio = async (audioUri: string) => {
    try {
      setIsLoading(true)

      // If a different audio is loaded, replace it
      if (currentSourceRef.current !== audioUri) {
        player.replace({ uri: audioUri })
        currentSourceRef.current = audioUri
      }

      // Play the audio
      await player.play()
    } catch (error) {
      console.error('Error playing audio:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stopAudio = async () => {
    try {
      if (player && status.playing) {
        player.pause()
        player.seekTo(0) // Reset to beginning
      }
    } catch (error) {
      console.error('Error stopping audio:', error)
    }
  }

  const pauseAudio = async () => {
    try {
      if (player && status.playing) {
        player.pause()
      }
    } catch (error) {
      console.error('Error pausing audio:', error)
    }
  }

  const resumeAudio = async () => {
    try {
      if (player && !status.playing) {
        await player.play()
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
    isLoading,
  }
}
