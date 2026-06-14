import type { OrderWordsActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { ArrowsClockwiseIcon } from '../icons'
import { Button, Card, Text, View } from '../ui'

interface OrderWordsStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

const OrderWordsStep = ({ activity, onAnswer }: OrderWordsStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const activityData = activity.data as OrderWordsActivityData | null | undefined
  const question = getValue(activity, 'question') || undefined
  const instructions = getValue(activity, 'instructions') || undefined
  const words = activityData?.words || []
  const correctOrder = activityData?.correct_order || []
  const [availableWords, setAvailableWords] = useState<string[]>([...words])
  const [orderedWords, setOrderedWords] = useState<string[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Reset state when activity changes (render-time state adjustment — avoids useEffect)
  const [prevActivity, setPrevActivity] = useState(activity)
  if (prevActivity !== activity) {
    setPrevActivity(activity)
    setAvailableWords([...words])
    setOrderedWords([])
    setShowFeedback(false)
    setIsCorrect(false)
  }

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
        {/* Question (optional; generic fallback when absent) */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-foreground text-center">
            {question ?? t`Put the words in the correct order`}
          </Text>
        </Card>

        <Text variant="body" className="text-foreground mb-4 text-center">
          {instructions ?? t`Tap words in the correct order`}
        </Text>

        {/* Ordered Words Area */}
        <Card className="mb-4 min-h-[100px] p-4">
          <View className="flex-row flex-wrap gap-2">
            {orderedWords.length === 0 ? (
              <Text variant="body" className="text-foreground w-full text-center">
                {t`Your answer will appear here`}
              </Text>
            ) : (
              orderedWords.map((word, index) => (
                <Animated.View key={`ordered-${index}`} entering={FadeIn.duration(160)}>
                  <Pressable
                    onPress={() => !showFeedback && handleRemoveWord(word, index)}
                    disabled={showFeedback}
                    className="border-primary bg-primary/10 rounded-lg border-2 px-4 py-2"
                  >
                    <Text variant="body" weight="bold" className="text-primary">
                      {word}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </View>
        </Card>

        {/* Available Words */}
        {availableWords.length > 0 && (
          <View className="mb-4">
            <Text variant="caption" weight="bold" className="text-foreground mb-2">
              {t`Available words:`}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {availableWords.map((word, index) => (
                <Pressable
                  key={`available-${index}`}
                  onPress={() => handleSelectWord(word)}
                  disabled={showFeedback}
                  className="border-border bg-card rounded-lg border-2 px-4 py-2"
                >
                  <Text variant="body" weight="bold" className="text-foreground">
                    {word}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Reset Button - shown when words are arranged (pre-check) or after wrong answer */}
        {(!showFeedback && orderedWords.length > 0) || (showFeedback && !isCorrect) ? (
          <Pressable onPress={handleReset} className="mb-4 flex-row items-center justify-center">
            <ArrowsClockwiseIcon size={20} className="text-primary" />
            <Text variant="body" className="text-primary ml-2">
              {t`Reset`}
            </Text>
          </Pressable>
        ) : null}

        {/* Feedback */}
        {showFeedback && (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Card className={`mb-4 p-4 ${isCorrect ? 'bg-success-bg' : 'bg-error-bg'}`}>
              <Text
                variant="h6"
                weight="bold"
                className={`text-center ${isCorrect ? 'text-success-text' : 'text-error-text'}`}
              >
                {isCorrect ? t`Perfect! Correct order!` : t`Not quite — tap Reset and try again`}
              </Text>
              {!isCorrect && (
                <Text variant="body" className="text-foreground mt-2 text-center">
                  {t`Correct order:`} {correctOrder.join(' ')}
                </Text>
              )}
            </Card>
          </Animated.View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
      <View className="border-border bg-card border-t px-6 py-4">
        <Button
          variant="primary"
          onPress={showFeedback ? handleContinue : handleCheck}
          disabled={(!showFeedback && !(orderedWords.length === words.length)) || (showFeedback && !isCorrect)}
          className="w-full"
        >
          <Text variant="body" weight="bold" className="text-white">
            {showFeedback ? t`Continue` : t`Check`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default OrderWordsStep
