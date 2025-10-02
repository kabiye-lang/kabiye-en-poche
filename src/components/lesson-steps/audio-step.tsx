import { useEffect } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'
import { SpeakerHighIcon, SpeakerSlashIcon } from 'phosphor-react-native'

import { Button, Card, Text, View } from '@/components/ui'
import { useAudio } from '@/hooks/use-audio'

interface AudioStepProps {
  audioType: 'single' | 'conversation'
  audioUrl?: string
  conversation?: {
    speaker: string
    text: string
    audioUrl?: string
  }[]
  transcript?: string
  onContinue: () => void
}

const AudioStep = ({ audioType, audioUrl, conversation, transcript, onContinue }: AudioStepProps) => {
  const { t } = useLingui()
  const { playAudio, stopAudio, isPlaying, isLoading } = useAudio()

  // Auto-play audio when component mounts (for single audio only)
  useEffect(() => {
    if (audioType === 'single' && audioUrl) {
      playAudio(audioUrl)
    }

    // Cleanup on unmount
    return () => {
      stopAudio()
    }
  }, [audioUrl, audioType])

  const handleToggleAudio = async (url?: string) => {
    if (!url) return

    if (isPlaying) {
      await stopAudio()
    } else {
      await playAudio(url)
    }
  }

  const handleContinue = () => {
    stopAudio() // Stop any playing audio
    onContinue()
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Single Audio */}
        {audioType === 'single' && (
          <View className="items-center py-8">
            <TouchableOpacity
              onPress={() => handleToggleAudio(audioUrl)}
              disabled={!audioUrl || isLoading}
              className={`h-24 w-24 items-center justify-center rounded-full shadow-lg ${
                !audioUrl ? 'bg-gray-300' : isPlaying ? 'bg-green-500' : 'bg-primary'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : isPlaying ? (
                <SpeakerHighIcon size={48} color="white" weight="fill" />
              ) : (
                <SpeakerSlashIcon size={48} color="white" weight="fill" />
              )}
            </TouchableOpacity>
            <Text variant="h6" className="mt-4 text-center text-text-dark dark:text-gray-100">
              {!audioUrl
                ? t`No audio available`
                : isLoading
                  ? t`Loading audio...`
                  : isPlaying
                    ? t`Playing... (Tap to stop)`
                    : t`Tap to listen`}
            </Text>
          </View>
        )}

        {/* Conversation */}
        {audioType === 'conversation' && conversation && (
          <View className="py-4">
            <Text variant="h5" weight="semibold" className="mb-4 text-primary">
              {t`Conversation`}
            </Text>
            {conversation.map((line, index) => (
              <Card key={index} className={`mb-3 ${index % 2 === 0 ? 'mr-12' : 'ml-12'} p-4`}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text variant="caption" weight="bold" className="mb-1 text-primary">
                      {line.speaker}
                    </Text>
                    <Text variant="body" className="text-text-dark dark:text-gray-100">
                      {line.text}
                    </Text>
                  </View>
                  {line.audioUrl && (
                    <TouchableOpacity
                      onPress={() => handleToggleAudio(line.audioUrl)}
                      className={`ml-3 rounded-full p-2 ${isPlaying ? 'bg-green-500' : 'bg-primary'}`}
                    >
                      {isPlaying ? (
                        <SpeakerHighIcon size={20} color="white" weight="fill" />
                      ) : (
                        <SpeakerSlashIcon size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Transcript */}
        {transcript && (
          <Card className="mb-4 p-4">
            <Text variant="caption" weight="bold" className="mb-2 text-text-grey dark:text-gray-400">
              {t`Transcript`}
            </Text>
            <Text variant="body" className="text-text-dark dark:text-gray-100">
              {transcript}
            </Text>
          </Card>
        )}

        {/* Placeholder if no audio */}
        {!audioUrl && (!conversation || conversation.length === 0) && (
          <Card className="p-6">
            <Text variant="body" className="text-center text-text-grey dark:text-gray-400">
              {t`Audio content will be available soon.`}
            </Text>
          </Card>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Continue Button */}
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <Button variant="primary" onPress={handleContinue} className="w-full">
          <Text variant="body" weight="bold" className="text-white">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default AudioStep
