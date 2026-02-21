import type { ListenTypeActivityData } from '@/types/activity-data'
import type { LessonActivity } from '@/types/supabase'

import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity } from 'react-native'

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
  const question = getValue(activity, 'question') || ''
  const instructions = getValue(activity, 'instructions') || ''
  const audioUrl = activityData?.audio_url
  const correctAnswer = activityData?.correct_answer || ''
  const hints = activityData?.hints || []
  const translation = getValue(activityData, 'translation') || ''

  const [userAnswer, setUserAnswer] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [showHints, setShowHints] = useState(false)

  // Reset state when question changes (new activity)
  useEffect(() => {
    setUserAnswer('')
    setShowFeedback(false)
    setShowHints(false)
  }, [question, correctAnswer])

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
          <Text variant="h5" weight="semibold" className="text-text-dark mb-4 text-center dark:text-gray-100">
            {question}
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
            <Text variant="caption" className="text-text-grey mt-2 text-center dark:text-gray-400">
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
              <Text variant="body" className="text-text-grey mt-3 text-center italic dark:text-gray-400">
                ({translation})
              </Text>
            )}
          </View>
        </Card>

        {/* Instructions */}
        {instructions && (
          <Text variant="body" className="text-text-grey mb-4 text-center dark:text-gray-400">
            {instructions}
          </Text>
        )}

        {/* Hints Button */}
        {hints.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowHints(!showHints)}
            className="mb-4 flex-row items-center justify-center gap-2"
          >
            <LightbulbIcon size={20} color="#f59e0b" weight="fill" />
            <Text variant="body" className="text-amber-600 dark:text-amber-400">
              {showHints ? t`Hide hints` : t`Show hints`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Hints Display */}
        {showHints && hints.length > 0 && (
          <Card className="mb-4 bg-amber-50 p-4 dark:bg-amber-900/20">
            {hints.map((hint: string, index: number) => (
              <Text key={index} variant="body" className="mb-1 text-amber-900 dark:text-amber-200">
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
            placeholderTextColor="#9ca3af"
            editable={!showFeedback}
            className={`min-h-[80px] rounded-lg border-2 p-4 text-lg ${
              showFeedback
                ? isCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
            } text-text-dark dark:text-gray-100`}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Card>

        {/* Feedback */}
        {showFeedback && (
          <Card
            className={`mb-4 p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
          >
            <Text
              variant="h6"
              weight="semibold"
              className={`mb-2 ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
            >
              {isCorrect ? t`Correct! ✓` : t`Not quite right ✗`}
            </Text>
            {!isCorrect && (
              <View>
                <Text variant="body" className="text-gray-700 dark:text-gray-300">
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
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        {!showFeedback ? (
          <Button variant="primary" onPress={handleCheck} disabled={!userAnswer.trim()} className="w-full">
            <Text variant="body" weight="bold" className="text-white">
              {t`Check Answer`}
            </Text>
          </Button>
        ) : (
          <Button variant="primary" onPress={handleContinue} className="w-full">
            <Text variant="body" weight="bold" className="text-white">
              {t`Continue`}
            </Text>
          </Button>
        )}
      </View>
    </View>
  )
}

export default ListenTypeStep
