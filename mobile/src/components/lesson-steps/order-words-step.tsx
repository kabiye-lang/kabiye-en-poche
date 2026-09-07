import type { OrderWordsActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { ArrowsClockwiseIcon } from '../icons'
import { Button, Text, View } from '../ui'

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

  const ready = orderedWords.length === words.length

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Order the words`}</Text>
        <Text weight="medium" className="text-foreground mt-2 text-[26px] leading-[1.25]">
          {question ?? t`Put the words in the correct order`}
        </Text>
        <Text className="text-foreground-secondary mt-2 text-[15px]">
          {instructions ?? t`Tap words in the correct order`}
        </Text>

        {/* The drop zone is a rule, not a box: the sentence being assembled sits on a
            line the way handwriting does. */}
        <View className="border-foreground mt-8 min-h-[120px] justify-end border-b-2 pb-3">
          <View className="flex-row flex-wrap gap-2">
            {orderedWords.map((word, index) => (
              <Animated.View key={`ordered-${index}`} entering={FadeIn.duration(160)}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => !showFeedback && handleRemoveWord(word, index)}
                  disabled={showFeedback}
                  className="bg-foreground rounded-full px-4 py-2"
                >
                  <Text kabiye weight="bold" className="text-background text-[22px]">
                    {word}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        <View className="mt-6 flex-row flex-wrap gap-2">
          {words.map((word, index) => {
            const used = !availableWords.includes(word)

            return (
              <Pressable
                key={`bank-${index}`}
                accessibilityRole="button"
                accessibilityState={{ disabled: used }}
                onPress={() => !used && handleSelectWord(word)}
                disabled={used || showFeedback}
                className="border-foreground rounded-full border-[1.5px] px-4 py-2"
              >
                <Text kabiye weight="bold" className="text-foreground text-[22px]">
                  {word}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {(!showFeedback && orderedWords.length > 0) || (showFeedback && !isCorrect) ? (
          <Pressable accessibilityRole="button" onPress={handleReset} className="mt-6 flex-row items-center self-start">
            <ArrowsClockwiseIcon size={18} className="text-foreground-secondary" />
            <Text className="text-foreground-secondary ml-2 text-[14px]">{t`Reset`}</Text>
          </Pressable>
        ) : null}

        {showFeedback ? (
          <Animated.View entering={FadeInDown.duration(220)} className="border-foreground mt-7 border-l-[3px] pl-4">
            <Text weight="semibold" className="text-foreground text-[17px]">
              {isCorrect ? t`Yes` : t`Not this time`}
            </Text>
            {!isCorrect ? (
              <>
                <Text kabiye weight="bold" className="text-foreground mt-2 text-[20px] leading-[1.35]">
                  {correctOrder.join(' ')}
                </Text>
                <Text className="text-foreground-secondary mt-2 text-[15px] leading-[1.5]">
                  {t`We'll ask this one again at the end.`}
                </Text>
              </>
            ) : null}
          </Animated.View>
        ) : null}

        <View className="h-24" />
      </ScrollView>

      <View className="px-6 pb-4">
        <Button
          variant="primary"
          onPress={showFeedback ? handleContinue : handleCheck}
          disabled={!showFeedback && !ready}
          className="w-full"
        >
          <Text weight="semibold" className="text-background text-[16px]">
            {showFeedback ? t`Continue` : t`Check`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default OrderWordsStep
