import type { LessonActivity } from '@/types/supabase'

import { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { ArrowsClockwiseIcon } from '@/components/icons'
import { Button, Card, Text, View } from '@/components/ui'
import { useLanguage } from '@/hooks/use-language'

interface OrderWordsStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

const OrderWordsStep = ({ activity, onAnswer }: OrderWordsStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  // Extract data from activity
  const activityData = activity.data as any
  const question = getValue(activity, 'question') || ''
  const instructions = getValue(activity, 'instructions') || ''
  const words = activityData?.words || []
  const correctOrder = activityData?.correct_order || []
  const [availableWords, setAvailableWords] = useState<string[]>([...words])
  const [orderedWords, setOrderedWords] = useState<string[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Reset state when question changes (new activity)
  useEffect(() => {
    setAvailableWords([...words])
    setOrderedWords([])
    setShowFeedback(false)
    setIsCorrect(false)
  }, [question, words])

  const handleSelectWord = (word: string) => {
    setAvailableWords(availableWords.filter((w) => w !== word))
    setOrderedWords([...orderedWords, word])
  }

  const handleRemoveWord = (word: string, index: number) => {
    setOrderedWords(orderedWords.filter((_, i) => i !== index))
    setAvailableWords([...availableWords, word])
  }

  const handleCheck = () => {
    const correct = JSON.stringify(orderedWords) === JSON.stringify(correctOrder)
    setIsCorrect(correct)
    setShowFeedback(true)
  }

  const handleReset = () => {
    setAvailableWords([...words])
    setOrderedWords([])
    setShowFeedback(false)
  }

  const handleContinue = () => {
    onAnswer(isCorrect, orderedWords.join(' '))
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-center text-text-dark dark:text-gray-100">
            {question}
          </Text>
        </Card>

        <Text variant="body" className="mb-4 text-center text-text-grey dark:text-gray-400">
          {instructions || t`Tap words in the correct order`}
        </Text>

        {/* Ordered Words Area */}
        <Card className="mb-4 min-h-[100px] p-4">
          <View className="flex-row flex-wrap gap-2">
            {orderedWords.length === 0 ? (
              <Text variant="body" className="w-full text-center text-text-grey dark:text-gray-400">
                {t`Your answer will appear here`}
              </Text>
            ) : (
              orderedWords.map((word, index) => (
                <TouchableOpacity
                  key={`ordered-${index}`}
                  onPress={() => !showFeedback && handleRemoveWord(word, index)}
                  disabled={showFeedback}
                  className="rounded-lg border-2 border-primary bg-primary/10 px-4 py-2"
                >
                  <Text variant="body" weight="bold" className="text-primary">
                    {word}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </Card>

        {/* Available Words */}
        {availableWords.length > 0 && (
          <View className="mb-4">
            <Text variant="caption" weight="bold" className="mb-2 text-text-grey dark:text-gray-400">
              {t`Available words:`}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {availableWords.map((word, index) => (
                <TouchableOpacity
                  key={`available-${index}`}
                  onPress={() => handleSelectWord(word)}
                  disabled={showFeedback}
                  className="rounded-lg border-2 border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <Text variant="body" weight="bold" className="text-text-dark dark:text-gray-100">
                    {word}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Reset Button */}
        {!showFeedback && orderedWords.length > 0 && (
          <TouchableOpacity onPress={handleReset} className="mb-4 flex-row items-center justify-center">
            <ArrowsClockwiseIcon size={20} className="text-primary" />
            <Text variant="body" className="ml-2 text-primary">
              {t`Reset`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Feedback */}
        {showFeedback && (
          <Card
            className={`mb-4 p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}
          >
            <Text
              variant="h6"
              weight="bold"
              className={`text-center ${
                isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}
            >
              {isCorrect ? t`Perfect! Correct order! 🎉` : t`Not quite right. Try again!`}
            </Text>
            {!isCorrect && (
              <Text variant="body" className="mt-2 text-center text-text-dark dark:text-gray-100">
                {t`Correct order:`} {correctOrder.join(' ')}
              </Text>
            )}
          </Card>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        {!showFeedback && orderedWords.length === words.length ? (
          <Button variant="primary" onPress={handleCheck} className="w-full">
            <Text variant="body" weight="bold" className="text-white">
              {t`Check`}
            </Text>
          </Button>
        ) : showFeedback ? (
          <Button variant="primary" onPress={handleContinue} className="w-full">
            <Text variant="body" weight="bold" className="text-white">
              {t`Continue`}
            </Text>
          </Button>
        ) : null}
      </View>
    </View>
  )
}

export default OrderWordsStep
