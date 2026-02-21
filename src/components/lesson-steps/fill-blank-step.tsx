import type { FillBlankActivityData } from '@/types/activity-data'
import type { LessonActivity } from '@/types/supabase'

import { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { Button, Card, Text, View } from '@/components/ui'
import { useLanguage } from '@/hooks/use-language'

interface FillBlankStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

const FillBlankStep = ({ activity, onAnswer }: FillBlankStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()

  const activityData = activity.data as FillBlankActivityData | null | undefined
  const question = getValue(activity, 'question') || undefined
  const instructions = getValue(activity, 'instructions') || undefined

  // Data is now directly in activityData, not nested in questions array
  const sentence = getValue(activityData, 'sentence') || ''
  const correctAnswer = activityData?.answer || ''
  const options = activityData?.options || []

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  // Reset state when activity changes
  useEffect(() => {
    setSelectedAnswer(null)
    setShowFeedback(false)
  }, [correctAnswer])

  const isCorrect = selectedAnswer === correctAnswer

  const handleSelectOption = (option: string) => {
    if (showFeedback) return
    setSelectedAnswer(option)
    setShowFeedback(true)
  }

  const handleContinue = () => {
    onAnswer(isCorrect, selectedAnswer || '')
  }

  // Split sentence by ___ to insert the blank
  const renderSentenceWithBlank = () => {
    const parts = sentence?.split('___') || []

    return (
      <View className="flex-row flex-wrap items-center justify-center">
        {parts.map((part: string, index: number) => (
          <View key={index} className="flex-row items-center">
            <Text variant="h6" className="text-text-dark dark:text-gray-100">
              {part}
            </Text>
            {index < parts.length - 1 && (
              <View
                className={`mx-2 min-w-[100px] rounded-lg border-2 border-dashed px-4 py-2 ${
                  selectedAnswer
                    ? showFeedback && isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : showFeedback && !isCorrect
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-primary bg-primary/10'
                    : 'border-gray-400 bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <Text
                  variant="h6"
                  weight="bold"
                  className={`text-center ${
                    selectedAnswer
                      ? showFeedback && isCorrect
                        ? 'text-green-700 dark:text-green-300'
                        : showFeedback && !isCorrect
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-primary'
                      : 'text-gray-400'
                  }`}
                >
                  {selectedAnswer || '___'}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    )
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question (optional; generic fallback when absent) */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-text-dark text-center dark:text-gray-100">
            {question ?? t`Fill in the blank`}
          </Text>
        </Card>

        {/* Instructions (optional; generic fallback when absent) */}
        <Text variant="body" className="text-text-grey mb-4 text-center dark:text-gray-400">
          {instructions ?? t`Choose the correct word to complete the sentence`}
        </Text>

        {/* Sentence with Blank */}
        <Card className="mb-6 p-6">{renderSentenceWithBlank()}</Card>

        {/* Options */}
        <View className="mb-4 gap-3">
          {options.map((option: string, index: number) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = option === correctAnswer
            const showCorrect = showFeedback && isCorrectOption
            const showIncorrect = showFeedback && isSelected && !isCorrectOption

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectOption(option)}
                disabled={showFeedback}
                className={`rounded-xl border-2 p-4 ${
                  showCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : showIncorrect
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <Text
                  variant="body"
                  weight={isSelected ? 'semibold' : 'regular'}
                  className={`text-center ${
                    showCorrect
                      ? 'text-green-700 dark:text-green-300'
                      : showIncorrect
                        ? 'text-red-700 dark:text-red-300'
                        : isSelected
                          ? 'text-primary'
                          : 'text-text-dark dark:text-gray-100'
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <Card
            className={`mb-4 p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
          >
            <Text
              variant="h6"
              weight="semibold"
              className={`text-center ${
                isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}
            >
              {isCorrect ? t`Correct! ✓` : t`Not quite right ✗`}
            </Text>
          </Card>
        )}

        {/* Add some bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Action Button */}
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <Button variant="primary" onPress={handleContinue} disabled={!showFeedback} className="w-full">
          <Text variant="body" weight="bold" className="text-white">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default FillBlankStep
