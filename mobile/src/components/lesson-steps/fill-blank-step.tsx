import type { FillBlankActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { Button, Card, Text, View } from '../ui'

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

  // Reset state when activity changes (render-time state adjustment — avoids useEffect)
  const [prevCorrectAnswer, setPrevCorrectAnswer] = useState(correctAnswer)
  if (prevCorrectAnswer !== correctAnswer) {
    setPrevCorrectAnswer(correctAnswer)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

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
            <Text variant="h6" className="text-foreground">
              {part}
            </Text>
            {index < parts.length - 1 && (
              <View
                className={`mx-2 min-w-[100px] rounded-lg border-2 border-dashed px-4 py-2 ${
                  selectedAnswer
                    ? showFeedback && isCorrect
                      ? 'bg-success-bg border-green-500'
                      : showFeedback && !isCorrect
                        ? 'bg-error-bg border-red-500'
                        : 'border-primary bg-primary/10'
                    : 'border-input-border bg-input-bg'
                }`}
              >
                <Text
                  variant="h6"
                  weight="bold"
                  className={`text-center ${
                    selectedAnswer
                      ? showFeedback && isCorrect
                        ? 'text-success-text'
                        : showFeedback && !isCorrect
                          ? 'text-error-text'
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
          <Text variant="h5" weight="semibold" className="text-foreground text-center">
            {question ?? t`Fill in the blank`}
          </Text>
        </Card>

        {/* Instructions (optional; generic fallback when absent) */}
        <Text variant="body" className="text-foreground mb-4 text-center">
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
              <Pressable
                key={index}
                onPress={() => handleSelectOption(option)}
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
                <Text
                  variant="body"
                  weight={isSelected ? 'semibold' : 'regular'}
                  className={`text-center ${
                    showCorrect
                      ? 'text-success-text'
                      : showIncorrect
                        ? 'text-error-text'
                        : isSelected
                          ? 'text-primary'
                          : 'text-foreground'
                  }`}
                >
                  {option}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <Card className={`mb-4 p-4 ${isCorrect ? 'bg-success-bg' : 'bg-error-bg'}`}>
            <Text
              variant="h6"
              weight="semibold"
              className={`text-center ${isCorrect ? 'text-success-text' : 'text-error-text'}`}
            >
              {isCorrect ? t`Correct! ✓` : t`Not quite right ✗`}
            </Text>
          </Card>
        )}

        {/* Add some bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Action Button */}
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

export default FillBlankStep
