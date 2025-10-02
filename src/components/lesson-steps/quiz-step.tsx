import { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { Button, Card, Text, View } from '@/components/ui'

interface QuizStepProps {
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank'
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  onAnswer: (isCorrect: boolean, answer: string) => void
}

const QuizStep = ({ questionType, question, options, correctAnswer, explanation, onAnswer }: QuizStepProps) => {
  const { t } = useLingui()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  // Reset state when question changes (new quiz step)
  useEffect(() => {
    setSelectedIndex(null)
    setShowFeedback(false)
  }, [question, correctAnswer])

  const handleSelectAnswer = (index: number) => {
    if (showFeedback) return
    setSelectedIndex(index)
    // Show instant feedback
    setShowFeedback(true)
  }

  const handleContinue = () => {
    if (selectedIndex === null) return
    const isCorrect = selectedIndex.toString() === correctAnswer
    const selectedAnswer = options[selectedIndex]
    onAnswer(isCorrect, selectedAnswer)
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-text-dark dark:text-gray-100">
            {question}
          </Text>
        </Card>

        {/* Options */}
        <View className="mb-4 gap-3">
          {options.map((option, index) => {
            const isSelected = selectedIndex === index
            const isCorrect = index.toString() === correctAnswer
            const showCorrect = showFeedback && isCorrect
            const showIncorrect = showFeedback && isSelected && !isCorrect

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectAnswer(index)}
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
                            : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {(isSelected || showCorrect) && <View className="h-3 w-3 rounded-full bg-white" />}
                  </View>

                  {/* Option Text */}
                  <Text
                    variant="body"
                    className={`flex-1 ${
                      showCorrect
                        ? 'text-green-700 dark:text-green-300'
                        : showIncorrect
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-text-dark dark:text-gray-100'
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
          <Card
            className={`mb-4 p-4 ${
              selectedIndex?.toString() === correctAnswer
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <Text
              variant="h6"
              weight="bold"
              className={`mb-2 ${
                selectedIndex?.toString() === correctAnswer
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {selectedIndex?.toString() === correctAnswer ? t`Correct! 🎉` : t`Not quite right`}
            </Text>
            {explanation && (
              <Text variant="body" className="text-text-dark dark:text-gray-100">
                {explanation}
              </Text>
            )}
          </Card>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        {showFeedback && (
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

export default QuizStep
