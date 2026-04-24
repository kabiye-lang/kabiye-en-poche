import type { QuizActivityData } from '@/types/activity-data'
import type { LessonActivity } from '@/types/supabase'

import { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { SparkleIcon } from '@/components/icons'
import { Button, Card, Text, View } from '@/components/ui'
import { useLanguage } from '@/hooks/use-language'

interface QuizStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
  progressPercent?: number
}

/** For true_false: index 0 = true, index 1 = false */
const TRUE_FALSE_VALUES: [boolean, boolean] = [true, false]

const QuizStep = ({ activity, onAnswer, progressPercent = 0 }: QuizStepProps) => {
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

  const correctAnswer: string | boolean = isTrueFalse
    ? (activityData?.answer ?? false)
    : typeof activityData?.correct_answer === 'object'
      ? useKbp
        ? (activityData.correct_answer?.kbp ?? activityData.correct_answer?.en ?? '')
        : (activityData.correct_answer?.[currentLanguage] ?? activityData.correct_answer?.en ?? '')
      : (activityData?.correct_answer ?? '')

  const explanationData = activityData?.explanation
  const explanation = explanationData?.[currentLanguage] ?? explanationData?.en ?? undefined

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    setSelectedIndex(null)
    setShowFeedback(false)
  }, [question, correctAnswer, activityData?.answer])

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

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-foreground">
            {question}
          </Text>
        </Card>

        {/* Instructions */}
        {instructions && (
          <Text variant="body" className="text-foreground-secondary mb-4 text-center">
            {instructions}
          </Text>
        )}

        {/* Options */}
        <View className="mb-4 gap-3">
          {options.map((option: string, index: number) => {
            const isSelected = selectedIndex === index
            const optionValue = isTrueFalse ? TRUE_FALSE_VALUES[index] : option
            const isCorrectOption = optionValue === correctAnswer
            const showCorrect = showFeedback && isCorrectOption
            const showIncorrect = showFeedback && isSelected && !isCorrectOption

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectAnswer(index)}
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
                            : 'border-border'
                    }`}
                  >
                    {(isSelected || showCorrect) && <View className="h-3 w-3 rounded-full bg-white" />}
                  </View>

                  {/* Option Text */}
                  <Text
                    variant="body"
                    className={`flex-1 ${
                      showCorrect ? 'text-success-text' : showIncorrect ? 'text-error-text' : 'text-foreground'
                    }`}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Motivational card – fills the void on T/F and short MCQ screens */}
        {!showFeedback && (
          <Animated.View entering={FadeIn.duration(350)} className="mt-4 mb-2">
            <View className="bg-primary/5 flex-row items-center gap-4 rounded-2xl px-5 py-4">
              <SparkleIcon size={28} weight="fill" className="text-primary" />
              <View className="flex-1">
                <Text variant="h6" weight="semibold" className="text-primary">
                  {progressPercent < 33
                    ? t`Every expert was once a beginner!`
                    : progressPercent < 66
                      ? t`Halfway there — keep going!`
                      : t`Almost done — you're doing great!`}
                </Text>
                <Text variant="caption" className="text-foreground-secondary mt-0.5">
                  {t`Take your time and think it through.`}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Feedback */}
        {showFeedback && selectedIndex !== null && (
          <Animated.View entering={FadeInDown.duration(220)}>
            <Card
              className={`mb-4 p-4 ${
                (isTrueFalse ? TRUE_FALSE_VALUES[selectedIndex] : options[selectedIndex]) === correctAnswer
                  ? 'bg-success-bg'
                  : 'bg-error-bg'
              }`}
            >
              <Text
                variant="h6"
                weight="bold"
                className={`mb-2 ${
                  (isTrueFalse ? TRUE_FALSE_VALUES[selectedIndex] : options[selectedIndex]) === correctAnswer
                    ? 'text-success-text'
                    : 'text-error-text'
                }`}
              >
                {(isTrueFalse ? TRUE_FALSE_VALUES[selectedIndex] : options[selectedIndex]) === correctAnswer
                  ? t`Correct!`
                  : t`Not quite right`}
              </Text>
              {explanation && (
                <Text variant="body" className="text-foreground">
                  {explanation}
                </Text>
              )}
            </Card>
          </Animated.View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
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

export default QuizStep
