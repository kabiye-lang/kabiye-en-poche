import type { ListenTypeActivityData } from '@/types/activity-data'
import type { LessonActivity } from '@/types/supabase'

import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, TextInput } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { LightbulbIcon, SpeakerHighIcon, SpeakerSlashIcon } from '@/components/icons'
import { Button, Card, Text, View } from '@/components/ui'
import { useAudio } from '@/hooks/use-audio'
import { useLanguage } from '@/hooks/use-language'

interface ListenTypeStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

const ListenTypeStep = ({ activity, onAnswer }: ListenTypeStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const { playAudio, stopAudio, isPlaying, isLoading } = useAudio()

  const activityData = activity.data as ListenTypeActivityData | null | undefined
  const question = getValue(activity, 'question') || undefined
  const instructions = getValue(activity, 'instructions') || undefined
  const audioUrl = activityData?.audio_url
  const correctAnswer = activityData?.correct_answer || ''
  const hints = activityData?.hints || []
  const translation = getValue(activityData, 'translation') || ''

  const [userAnswer, setUserAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [showHints, setShowHints] = useState(false)

  // Reset state when activity changes (render-time state adjustment — avoids useEffect)
  const [prevCorrectAnswer, setPrevCorrectAnswer] = useState(correctAnswer)
  if (prevCorrectAnswer !== correctAnswer) {
    setPrevCorrectAnswer(correctAnswer)
    setUserAnswer('')
    setShowFeedback(false)
    setShowHints(false)
  }

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

  const handleCheck = () => {
    if (!userAnswer.trim()) return
    setShowFeedback(true)
  }

  const handleContinue = () => {
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()
    stopAudio()
    onAnswer(isCorrect, userAnswer.trim())
  }

  const handleToggleAudio = async () => {
    if (!audioUrl) return

    if (isPlaying) {
      await stopAudio()
    } else {
      await playAudio(audioUrl)
    }
  }

  const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question with Audio */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-foreground mb-4 text-center">
            {question ?? t`Listen and type what you hear`}
          </Text>

          {/* Audio Player */}
          <View className="items-center py-4">
            <Pressable
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
            </Pressable>
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
          {instructions ?? t`Listen to the audio and type the Kabiyè word`}
        </Text>

        {/* Hints Button */}
        {hints.length > 0 && (
          <Pressable
            onPress={() => setShowHints(!showHints)}
            className="mb-4 flex-row items-center justify-center gap-2"
          >
            <LightbulbIcon size={20} color="#f59e0b" weight="fill" />
            <Text variant="body" className="text-hint">
              {showHints ? t`Hide hints` : t`Show hints`}
            </Text>
          </Pressable>
        )}

        {/* Hints Display */}
        {showHints && hints.length > 0 && (
          <Card className="bg-hint-bg mb-4 p-4">
            {hints.map((hint: string, index: number) => (
              <Text key={index} variant="body" className="text-foreground mb-1">
                💡 {hint}
              </Text>
            ))}
          </Card>
        )}

        {/* Text Input */}
        <Card className="mb-4 p-4">
          <TextInput
            value={userAnswer}
            onChangeText={setUserAnswer}
            placeholder={t`Type what you hear...`}
            placeholderTextColor="#6E6B7B"
            editable={!showFeedback}
            className={`min-h-[80px] rounded-lg border-2 p-4 text-lg ${
              showFeedback
                ? isCorrect
                  ? 'bg-success-bg border-green-500'
                  : 'bg-error-bg border-red-500'
                : 'border-border bg-card'
            } text-foreground`}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Card>

        {/* Feedback */}
        {showFeedback && (
          <Card className={`mb-4 p-4 ${isCorrect ? 'bg-success-bg' : 'bg-error-bg'}`}>
            <Text
              variant="h6"
              weight="semibold"
              className={`mb-2 ${isCorrect ? 'text-success-text' : 'text-error-text'}`}
            >
              {isCorrect ? t`Correct! ✓` : t`Not quite right ✗`}
            </Text>
            {!isCorrect && (
              <View>
                <Text variant="body" className="text-foreground">
                  {t`Correct answer:`} <Text weight="bold">{correctAnswer}</Text>
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Add some bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Action Button */}
      <View className="border-border bg-card border-t px-6 py-4">
        <Button
          variant="primary"
          onPress={showFeedback ? handleContinue : handleCheck}
          disabled={!showFeedback && !userAnswer.trim()}
          className="w-full"
        >
          <Text variant="body" weight="bold" className="text-white">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default ListenTypeStep
