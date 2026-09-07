import type { FillBlankActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { CheckIcon } from '../icons'
import { Button, Text, View } from '../ui'

interface FillBlankStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

/**
 * A sentence with a word taken out of it, and the word to put back.
 *
 * Right and wrong are told in ink and laterite, never green and red. A correct option
 * fills with ink because it is settled; a wrong one keeps its outline in laterite and is
 * struck through, and the right answer fills beside it. Colour-blind readers get the
 * same information as everyone else, and the screen stays in the palette.
 */
const FillBlankStep = ({ activity, onAnswer }: FillBlankStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()

  const activityData = activity.data as FillBlankActivityData | null | undefined
  const question = getValue(activity, 'question') || undefined
  const instructions = getValue(activity, 'instructions') || undefined

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

  /**
   * The sentence, with the blank as a rule the answer drops onto.
   *
   * Each blank is grouped with the text that FOLLOWS it, not the text before it.
   * Grouping it with the text before left the tail of the sentence as its own flex item,
   * so a sentence ending in a blank dropped its final full stop onto a line of its own.
   */
  const renderSentenceWithBlank = () => {
    const parts = sentence?.split('___') || []

    // The sentence carries the frame and the blank carries the Kabiyè, so they are not
    // the same size: 36px is the direction's figure for a Kabiyè sentence, and applying
    // it to an English one pushed the blank onto a line of its own.
    return (
      <View className="flex-row flex-wrap items-baseline">
        <Text className="text-foreground text-[24px]" style={{ lineHeight: 36 }}>
          {parts[0]}
        </Text>
        {parts.slice(1).map((part: string, index: number) => (
          <View key={index} className="flex-row items-baseline">
            <View className="border-foreground mx-2 min-w-[120px] border-b-[3px] pb-0.5">
              <Text kabiye weight="bold" className="text-foreground text-center text-[26px]" style={{ lineHeight: 34 }}>
                {selectedAnswer || ' '}
              </Text>
            </View>
            <Text className="text-foreground text-[24px]" style={{ lineHeight: 36 }}>
              {part}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Fill the blank`}</Text>
        <Text weight="medium" className="text-foreground mt-2 text-[26px] leading-[1.25]">
          {question ?? t`Fill in the blank`}
        </Text>
        <Text className="text-foreground-secondary mt-2 text-[15px]">
          {instructions ?? t`Choose the word that completes the sentence`}
        </Text>

        <View className="mt-8">{renderSentenceWithBlank()}</View>

        <View className="mt-8 gap-3">
          {options.map((option: string, index: number) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = option === correctAnswer
            const fillsIn = showFeedback && isCorrectOption
            const struckThrough = showFeedback && isSelected && !isCorrectOption

            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleSelectOption(option)}
                disabled={showFeedback}
                className={
                  fillsIn
                    ? 'bg-foreground border-foreground flex-row items-center justify-center gap-2 rounded-full border-[1.5px] px-5 py-3.5'
                    : struckThrough
                      ? 'border-accent flex-row items-center justify-center rounded-full border-[1.5px] px-5 py-3.5'
                      : 'border-foreground flex-row items-center justify-center rounded-full border-[1.5px] px-5 py-3.5'
                }
              >
                <Text
                  kabiye
                  weight="bold"
                  className={fillsIn ? 'text-background text-[20px]' : 'text-foreground text-[20px]'}
                  style={struckThrough ? { textDecorationLine: 'line-through' } : undefined}
                >
                  {option}
                </Text>
                {fillsIn ? <CheckIcon size={18} weight="bold" className="text-background" /> : null}
              </Pressable>
            )
          })}
        </View>

        {showFeedback ? (
          <View className="border-foreground mt-7 border-l-[3px] pl-4">
            <Text weight="semibold" className="text-foreground text-[17px]">
              {isCorrect ? t`Yes` : t`Not this time`}
            </Text>
            {!isCorrect ? (
              <Text className="text-foreground-secondary mt-2 text-[15px] leading-[1.5]">
                {t`We'll ask this one again at the end.`}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View className="h-24" />
      </ScrollView>

      <View className="px-6 pb-4">
        <Button
          variant="primary"
          onPress={() => onAnswer(isCorrect, selectedAnswer || '')}
          disabled={!showFeedback}
          className="w-full"
        >
          <Text weight="semibold" className="text-background text-[16px]">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default FillBlankStep
