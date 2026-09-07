import type { QuizActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { correctIndex } from '../../utils/activity-answer'
import { Button, Text, View } from '../ui'

interface QuizStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

/** For true_false: index 0 = true, index 1 = false */
const TRUE_FALSE_VALUES: [boolean, boolean] = [true, false]

const QuizStep = ({ activity, onAnswer }: QuizStepProps) => {
  const { t } = useLingui()
  const { getValue, currentLanguage } = useLanguage()
  const activityData = activity.data as QuizActivityData | null | undefined
  const question = getValue(activity, 'question') || ''
  const instructions = getValue(activity, 'instructions') || ''

  const isTrueFalse = activity.activity_type === 'true_false'

  // true_false: built-in True/False labels, correct answer from data.answer
  // multiple_choice: options and correct_answer from data
  const optionsData = activityData?.options
  const optionsUi = optionsData?.[currentLanguage] ?? optionsData?.en
  const optionsKbp = optionsData?.kbp
  const useKbp = !optionsUi?.length && optionsKbp?.length
  const options: string[] = isTrueFalse ? [t`True`, t`False`] : useKbp ? (optionsKbp ?? []) : (optionsUi ?? [])

  // Matched by position, not by string: when the options are a list per language and
  // `correct_answer` is one string, comparing values marks every French answer wrong.
  // See `utils/activity-answer.ts`.
  const answerIndex = isTrueFalse ? -1 : correctIndex(activityData, useKbp ? 'kbp' : currentLanguage)
  const correctAnswer: string | boolean = isTrueFalse ? (activityData?.answer ?? false) : (options[answerIndex] ?? '')

  const explanationData = activityData?.explanation
  const explanation = explanationData?.[currentLanguage] ?? explanationData?.en ?? undefined

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  // Reset state when activity changes (render-time state adjustment — avoids useEffect)
  const [prevCorrectAnswer, setPrevCorrectAnswer] = useState<string | boolean>(correctAnswer)
  if (prevCorrectAnswer !== correctAnswer) {
    setPrevCorrectAnswer(correctAnswer)
    setSelectedIndex(null)
    setShowFeedback(false)
  }

  const handleSelectAnswer = (index: number) => {
    if (showFeedback) return
    setSelectedIndex(index)
    setShowFeedback(true)
  }

  const handleContinue = () => {
    if (selectedIndex === null) return
    const selectedAnswer = isTrueFalse ? TRUE_FALSE_VALUES[selectedIndex] : options[selectedIndex]
    const isCorrect = selectedAnswer === correctAnswer
    onAnswer(isCorrect, String(selectedAnswer))
  }

  const chosen =
    selectedIndex === null ? undefined : isTrueFalse ? TRUE_FALSE_VALUES[selectedIndex] : options[selectedIndex]
  const gotItRight = chosen === correctAnswer

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Choose`}</Text>
        <Text weight="medium" className="text-foreground mt-2 text-[26px] leading-[1.25]">
          {question}
        </Text>
        {instructions ? <Text className="text-foreground-secondary mt-2 text-[15px]">{instructions}</Text> : null}

        <View className="mt-8 gap-3">
          {options.map((option: string, index: number) => {
            const isSelected = selectedIndex === index
            const optionValue = isTrueFalse ? TRUE_FALSE_VALUES[index] : option
            const isCorrectOption = optionValue === correctAnswer
            const fillsIn = showFeedback && isCorrectOption
            const struckThrough = showFeedback && isSelected && !isCorrectOption

            return (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleSelectAnswer(index)}
                disabled={showFeedback}
                className={
                  fillsIn
                    ? 'bg-foreground border-foreground flex-row items-center rounded-[14px] border-[1.5px] p-[18px]'
                    : struckThrough
                      ? 'border-accent flex-row items-center rounded-[14px] border-[1.5px] p-[18px]'
                      : 'border-foreground flex-row items-center rounded-[14px] border-[1.5px] p-[18px]'
                }
              >
                <View
                  className={
                    fillsIn
                      ? 'border-background mr-3 h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px]'
                      : struckThrough
                        ? 'border-accent mr-3 h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px]'
                        : 'border-foreground mr-3 h-[22px] w-[22px] items-center justify-center rounded-full border-[1.5px]'
                  }
                >
                  {isSelected || fillsIn ? (
                    <View
                      className={
                        fillsIn ? 'bg-background h-2.5 w-2.5 rounded-full' : 'bg-foreground h-2.5 w-2.5 rounded-full'
                      }
                    />
                  ) : null}
                </View>
                <Text
                  className={fillsIn ? 'text-background flex-1 text-[17px]' : 'text-foreground flex-1 text-[17px]'}
                  style={struckThrough ? { textDecorationLine: 'line-through' } : undefined}
                >
                  {option}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* The screen used to fill its empty half with a sparkle and "Every expert was
            once a beginner!". There is no score in this app and no cheerleading either:
            what belongs in that space is the explanation, once there is one to give. */}
        {showFeedback ? (
          <Animated.View entering={FadeInDown.duration(220)} className="border-foreground mt-7 border-l-[3px] pl-4">
            <Text weight="semibold" className="text-foreground text-[17px]">
              {gotItRight ? t`Yes` : t`Not this time`}
            </Text>
            {explanation ? (
              <Text className="text-foreground-secondary mt-2 text-[15px] leading-[1.5]">{explanation}</Text>
            ) : null}
            {!gotItRight ? (
              <Text className="text-foreground-secondary mt-2 text-[15px] leading-[1.5]">
                {t`We'll ask this one again at the end.`}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}

        <View className="h-24" />
      </ScrollView>

      <View className="px-6 pb-4">
        <Button variant="primary" onPress={handleContinue} disabled={!showFeedback} className="w-full">
          <Text weight="semibold" className="text-background text-[16px]">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default QuizStep
