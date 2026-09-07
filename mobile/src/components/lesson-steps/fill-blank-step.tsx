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
   * One `Text` with the blank nested inside it, not a row of flex items. A wrapping
   * flex-row breaks only between its children, so the text following the blank was one
   * unbreakable run and ran off the right edge; nested `Text` flows and wraps like prose.
   * The rule is an underline rather than a 3px border for the same reason -- a bordered
   * `View` is a flex item again.
   */
  const renderSentenceWithBlank = () => {
    const parts = sentence?.split('___') || []

    return (
      <Text className="text-foreground text-[24px]" style={{ lineHeight: 38 }}>
        {parts[0]}
        {parts.slice(1).map((part: string, index: number) => (
          <Text key={index} className="text-foreground text-[24px]">
            <Text
              kabiye
              weight="bold"
              className="text-foreground text-[24px]"
              style={{ textDecorationLine: 'underline' }}
            >
              {/* No-break spaces: a figure space still breaks, and a sentence ending in
                  the blank dropped its full stop onto a line of its own. */}
              {selectedAnswer || '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
            </Text>
            {part}
          </Text>
        ))}
      </Text>
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
