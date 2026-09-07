import type { SpotLetterActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useMemo, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { differingIndices, spellingVariants } from '../../utils/kabiye-variants'
import { CheckCircleIcon } from '../icons'
import { Button, Text, View } from '../ui'

interface SpotLetterStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

/** Deterministic shuffle, seeded by the word, so the answer does not move between renders. */
function seededOrder<T>(items: T[], seed: string): T[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0
    const j = h % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * "Which spelling is right?" — three spellings of one word, on an ink screen.
 *
 * The two wrong ones are derived from the right one (see utils/kabiye-variants), so the
 * learner is choosing against the exact mistake a French keyboard invites rather than
 * against a word somebody made up.
 */
const SpotLetterStep = ({ activity, onAnswer }: SpotLetterStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const data = activity.data as SpotLetterActivityData | null | undefined

  const correct = data?.correct?.trim() ?? ''
  const gloss = getValue(data ?? null, 'gloss') || undefined
  const explanation = getValue(data ?? null, 'explanation') || undefined

  const [selected, setSelected] = useState<string | null>(null)

  const options = useMemo(() => {
    // A row may carry hand-checked distractors; otherwise derive them.
    const supplied = (data?.distractors ?? []).filter((d) => d && d !== correct)
    const derived = supplied.length >= 2 ? supplied : spellingVariants(correct, 2).map((v) => v.text)
    return seededOrder([correct, ...derived.slice(0, 2)], correct)
  }, [correct, data?.distractors])

  // Three options or none.
  //
  // Substitution can only produce as many distractors as the word has letters French
  // cannot write, so a word with one of them yields one -- and a two-option question is
  // a coin flip that teaches nothing, which is why `true_false` was retired. Better to
  // drop the step than to ask a question the learner can win by guessing; the same rule
  // as the missing audio recordings.
  if (!correct || options.length < 3) return null

  // Selecting only reveals the explanation; `Continue` is what advances. Answering and
  // advancing in one tap skipped the sentence that says which letter was wrong and why,
  // which is the entire teaching content of the step.
  const handleSelect = (option: string) => {
    if (selected) return
    setSelected(option)
  }

  return (
    <View className="bg-foreground flex-1">
      <ScrollView contentContainerClassName="px-6 pb-10 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">
          {t`Spot the letter`}
        </Text>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text className="text-background mt-3 text-[26px] leading-[1.15]">
            {gloss ? t`Which spelling is right for “${gloss}”?` : t`Which spelling is right?`}
          </Text>
        </Animated.View>

        <View className="mt-8 gap-3">
          {options.map((option) => {
            const isChosen = selected === option
            const wrongLetters = differingIndices(correct, option)
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={option}
                accessibilityState={{ selected: isChosen, disabled: selected !== null }}
                onPress={() => handleSelect(option)}
                className={
                  isChosen
                    ? 'bg-background flex-row items-center justify-between rounded-[14px] px-5 py-5'
                    : 'flex-row items-center justify-between rounded-[14px] border-[1.5px] border-[rgba(244,235,221,0.35)] px-5 py-5'
                }
              >
                <Text
                  kabiye
                  className={isChosen ? 'text-foreground text-[44px]' : 'text-background text-[44px]'}
                  weight="bold"
                >
                  {[...option].map((ch, i) => (
                    <Text
                      key={`${option}-${i}`}
                      kabiye
                      weight="bold"
                      className={
                        wrongLetters.includes(i)
                          ? 'text-accent text-[44px]'
                          : isChosen
                            ? 'text-foreground text-[44px]'
                            : 'text-background text-[44px]'
                      }
                    >
                      {ch}
                    </Text>
                  ))}
                </Text>
                {isChosen ? <CheckCircleIcon size={24} color="#C4451C" weight="fill" /> : null}
              </Pressable>
            )
          })}
        </View>

        {selected ? (
          <Animated.View entering={FadeIn.duration(220)} className="mt-7">
            <Text className="text-background/70 text-[15px] leading-[1.5]">
              {selected === correct
                ? (explanation ?? t`That is the attested spelling.`)
                : t`The right spelling is ${correct}. We'll ask this one again at the end.`}
            </Text>
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

export default SpotLetterStep
