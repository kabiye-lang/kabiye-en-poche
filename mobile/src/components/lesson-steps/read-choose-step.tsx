import type { ReadChooseActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { Button, Text, View } from '../ui'

interface ReadChooseStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

/**
 * A Kabiyè sentence and three readings of it.
 *
 * The sentence sits behind a 3px ink rule rather than in a card: it is the thing being
 * read, and a card would make it another element on the screen instead of the subject.
 */
const ReadChooseStep = ({ activity, onAnswer }: ReadChooseStepProps) => {
  const { t } = useLingui()
  const { currentLanguage, getLocalised } = useLanguage()
  const data = activity.data as ReadChooseActivityData | null | undefined

  const sentence = data?.sentence?.trim() ?? ''
  // Options are keyed by interface language -- `{ en: [...], fr: [...] }` -- the same
  // shape quiz-step reads. `getJsonValue` would look for `options_en` instead, which is
  // the other convention in this codebase and not the one the schema emits.
  const options =
    data?.options?.[currentLanguage] ??
    data?.options?.en ??
    ((data as Record<string, unknown> | undefined)?.[`options_${currentLanguage}`] as string[] | undefined) ??
    ((data as Record<string, unknown> | undefined)?.options_en as string[] | undefined) ??
    []
  const rawCorrect = data?.correct_answer
  const correct = typeof rawCorrect === 'string' ? rawCorrect : (rawCorrect?.[currentLanguage] ?? rawCorrect?.en ?? '')
  const explanation = getLocalised(data as Record<string, unknown>, 'explanation')

  const [selected, setSelected] = useState<string | null>(null)

  // Without a sentence there is nothing to read, and without options nothing to choose.
  if (!sentence || options.length < 2) return null

  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
  }

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Read and choose`}</Text>

        <Animated.View entering={FadeInDown.duration(600)}>
          <View className="border-foreground mt-5 border-l-[3px] pl-4">
            <Text kabiye weight="bold" className="text-foreground text-[34px] leading-[1.3]">
              {sentence}
            </Text>
          </View>
        </Animated.View>

        <Text className="text-foreground-secondary mt-6 text-[15px]">{t`What does it say?`}</Text>

        <View className="mt-4 gap-3">
          {options.map((option) => {
            const isChosen = selected === option
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityLabel={option}
                accessibilityState={{ selected: isChosen, disabled: selected !== null }}
                onPress={() => handleSelect(option)}
                className={
                  isChosen
                    ? 'bg-foreground flex-row items-center gap-3 rounded-[14px] px-4 py-4'
                    : 'border-foreground flex-row items-center gap-3 rounded-[14px] border-[1.5px] px-4 py-4'
                }
              >
                <View
                  className={
                    isChosen
                      ? 'border-background h-[20px] w-[20px] rounded-full border-2'
                      : 'border-foreground h-[20px] w-[20px] rounded-full border-2'
                  }
                />
                <Text
                  className={isChosen ? 'text-background flex-1 text-[18px]' : 'text-foreground flex-1 text-[18px]'}
                >
                  {option}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {selected ? (
          <Animated.View entering={FadeIn.duration(220)} className="border-foreground mt-6 border-l-[3px] pl-4">
            <Text className="text-foreground text-[13px] font-semibold uppercase tracking-[0.1em]">
              {selected === correct ? t`Yes` : t`Not this time`}
            </Text>
            <Text className="text-foreground mt-2 text-[17px] leading-[1.5]">
              {selected === correct ? (explanation ?? t`That is what it says.`) : t`It says: ${correct}`}
            </Text>
            {selected !== correct ? (
              <Text className="text-foreground-secondary mt-2 text-[15px]">
                {t`We'll ask this one again at the end.`}
              </Text>
            ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>

      {selected ? (
        <View className="px-6 pb-8">
          <Button variant="primary" fullWidth onPress={() => onAnswer(selected === correct, selected)}>
            {t`Continue`}
          </Button>
        </View>
      ) : null}
    </View>
  )
}

export default ReadChooseStep
