import type { ListenChooseActivityData } from '@/types/activity-data'
import type { LessonActivity } from '@/types/supabase'

import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { SpeakerHighIcon, SpeakerSlashIcon } from '@/components/icons'
import { Button, Card, Text, View } from '@/components/ui'
import { useAudio } from '@/hooks/use-audio'
import { useLanguage } from '@/hooks/use-language'

interface ListenChooseStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

const ListenChooseStep = ({ activity, onAnswer }: ListenChooseStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const { playAudio, stopAudio, isPlaying, isLoading } = useAudio()

  const activityData = activity.data as ListenChooseActivityData | null | undefined
  const question = getValue(activity, 'question') || undefined
  const instructions = getValue(activity, 'instructions') || undefined
  const audioUrl = activityData?.audio_url // Audio URL comes from data only

  // Options are not localized - they are plain strings (Kabiyè words)
  const options = activityData?.options || []
  const correctAnswer = activityData?.correct_answer || ''

  // Translation is stored separately in the data
  const translation = getValue(activityData, 'translation') || ''

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  // Reset state when question changes (new activity)
  useEffect(() => {
    setSelectedIndex(null)
    setShowFeedback(false)
  }, [correctAnswer])

  // Auto-play audio when component mounts or changes
  useEffect(() => {
    if (audioUrl) {
      playAudio(audioUrl)
    }

    // Cleanup on unmount
    return () => {
      stopAudio()
    }
  }, [audioUrl])

  const handleSelectAnswer = (index: number) => {
    if (showFeedback) return
    setSelectedIndex(index)
    // Show instant feedback
    setShowFeedback(true)
  }

  const handleContinue = () => {
    if (selectedIndex === null) return
    const selectedAnswer = options[selectedIndex]
    const isCorrect = selectedAnswer === correctAnswer
    stopAudio() // Stop audio when moving to next step
    onAnswer(isCorrect, selectedAnswer)
  }

  const handleToggleAudio = async () => {
    if (!audioUrl) return

    if (isPlaying) {
      await stopAudio()
    } else {
      await playAudio(audioUrl)
    }
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question with Audio */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-foreground mb-4 text-center">
            {question ?? t`Listen and choose the correct word`}
          </Text>

          {/* Audio Player */}
          <View className="items-center py-4">
            <TouchableOpacity
              onPress={handleToggleAudio}
              disabled={!audioUrl || isLoading}
              className={`h-20 w-20 items-center justify-center rounded-full shadow-lg ${
                !audioUrl ? 'bg-gray-300' : isPlaying ? 'bg-green-500' : 'bg-primary'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : isPlaying ? (
                <SpeakerHighIcon size={40} color="white" weight="fill" />
              ) : (
                <SpeakerSlashIcon size={40} color="white" weight="fill" />
              )}
            </TouchableOpacity>
            <Text variant="caption" className="text-foreground-secondary mt-2 text-center">
              {!audioUrl
                ? t`No audio available`
                : isLoading
                  ? t`Loading audio...`
                  : isPlaying
                    ? t`Playing... (Tap to stop)`
                    : t`Tap to listen`}
            </Text>

            {/* Translation hint */}
            {translation && (
              <Text variant="body" className="text-foreground-secondary mt-3 text-center italic">
                ({translation})
              </Text>
            )}
          </View>
        </Card>

        {/* Instructions (optional; generic fallback when absent) */}
        <Text variant="body" className="text-foreground-secondary mb-4 text-center">
          {instructions ?? t`Listen to the audio and select the correct Kabiyè word`}
        </Text>

        {/* Options */}
        <View className="mb-4 gap-3">
          {options.map((option: string, index: number) => {
            const isSelected = selectedIndex === index
            const isCorrect = option === correctAnswer
            const showCorrect = showFeedback && isCorrect
            const showIncorrect = showFeedback && isSelected && !isCorrect

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectAnswer(index)}
                disabled={showFeedback}
                className={`rounded-xl border-2 p-4 ${
                  showCorrect
                    ? 'bg-success-bg border-green-500'
                    : showIncorrect
                      ? 'bg-error-bg border-red-500'
                      : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card'
                }`}
              >
                <View className="flex-row items-center">
                  {/* Radio Button */}
                  <View
                    className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
                      showCorrect
                        ? 'border-green-500 bg-green-500'
                        : showIncorrect
                          ? 'border-red-500 bg-red-500'
                          : isSelected
                            ? 'border-primary bg-primary'
                            : 'border-border'
                    }`}
                  >
                    {(isSelected || showCorrect) && <View className="h-3 w-3 rounded-full bg-white" />}
                  </View>

                  {/* Option Text */}
                  <Text
                    variant="h6"
                    weight="bold"
                    className={`flex-1 ${
                      showCorrect ? 'text-success-text' : showIncorrect ? 'text-error-text' : 'text-foreground'
                    }`}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <Card className={`mb-4 p-4 ${options[selectedIndex!] === correctAnswer ? 'bg-success-bg' : 'bg-error-bg'}`}>
            <Text
              variant="h6"
              weight="bold"
              className={`${options[selectedIndex!] === correctAnswer ? 'text-success-text' : 'text-error-text'}`}
            >
              {options[selectedIndex!] === correctAnswer ? t`Correct!` : t`Not quite right`}
            </Text>
          </Card>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
      <View className="border-border bg-card border-t px-6 py-4">
        <Button variant="primary" onPress={handleContinue} disabled={!showFeedback} className="w-full">
          <Text variant="body" weight="bold" className="text-white">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default ListenChooseStep
