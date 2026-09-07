import type { SpellActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { LightbulbIcon } from '../icons'
import { Button, Text, View } from '../ui'

interface SpellStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

/**
 * The eight letters a French keyboard cannot reach.
 *
 * They get their own row, in ink, above the ordinary letters -- the app ships a keyboard
 * at all because these are missing from the ones learners have, so hiding them behind a
 * modifier would reproduce the problem the product exists to solve.
 */
const KABIYE_KEYS = ['ɖ', 'ɛ', 'ɣ', 'ɩ', 'ŋ', 'ɔ', 'ʋ', 'ñ']

const LATIN_ROWS = [
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'c', 'v', 'b', 'n'],
]

/**
 * Compare what the learner wrote against the attested spelling.
 *
 * Normalised to NFC and case-folded: the exercise is about which letters the word uses,
 * not about the shift key, and `ɛ` composed two different ways is the same letter to a
 * reader even though it is not to `===`.
 */
export function matchesSpelling(written: string, answer: string): boolean {
  const norm = (s: string) => s.normalize('NFC').trim().toLocaleLowerCase()
  return norm(written) === norm(answer) && norm(answer).length > 0
}

/** "Write X in Kabiyè" — the step that asks the learner to produce, not recognise. */
const SpellStep = ({ activity, onAnswer }: SpellStepProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const data = activity.data as SpellActivityData | null | undefined

  const answer = data?.answer?.trim() ?? ''
  const gloss = getValue(data ?? null, 'gloss') || undefined
  const hint = getValue(data ?? null, 'hint') || undefined

  const [written, setWritten] = useState('')
  const [checked, setChecked] = useState<boolean | null>(null)

  if (!answer) return null

  const isCorrect = matchesSpelling(written, answer)

  const type = (ch: string) => {
    if (checked !== null) return
    setWritten((w) => w + ch)
  }
  const backspace = () => {
    if (checked !== null) return
    setWritten((w) => [...w].slice(0, -1).join(''))
  }
  const check = () => {
    if (checked !== null || written.length === 0) return
    setChecked(isCorrect)
  }

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="px-6 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Spell it`}</Text>

        <Animated.View entering={FadeInDown.duration(600)}>
          <Text className="text-foreground mt-3 text-[26px] leading-[1.15]">
            {gloss ? t`Write “${gloss}” in Kabiyè` : t`Write the word in Kabiyè`}
          </Text>
        </Animated.View>

        {/* Answer line: a 2px ink underline, not a boxed input — the word is the subject. */}
        <View className="border-foreground mt-9 min-h-[64px] justify-end border-b-2 pb-2">
          <Text
            kabiye
            weight="bold"
            className={checked === false ? 'text-accent text-[40px] line-through' : 'text-foreground text-[40px]'}
          >
            {written || ' '}
          </Text>
        </View>

        {checked === false ? (
          <Animated.View entering={FadeIn.duration(220)} className="mt-4">
            <Text className="text-foreground-secondary text-[15px]">{t`The spelling is`}</Text>
            <Text kabiye weight="bold" className="text-foreground mt-1 text-[28px]">
              {answer}
            </Text>
            <Text className="text-foreground-secondary mt-2 text-[15px]">
              {t`We'll ask this one again at the end.`}
            </Text>
          </Animated.View>
        ) : null}

        {checked === null && hint ? (
          <View className="mt-4 flex-row items-start gap-2">
            <LightbulbIcon size={16} className="text-foreground-secondary mt-[2px]" />
            <Text className="text-foreground-secondary flex-1 text-[14px] leading-[1.4]">{hint}</Text>
          </View>
        ) : null}
      </ScrollView>

      {checked === null ? (
        // Keyboard tray. Kabiyè letters in ink on top, the ordinary keys in paper below.
        <View className="bg-background-tertiary px-2 pb-8 pt-3">
          <View className="mb-2 flex-row justify-center gap-[6px]">
            {KABIYE_KEYS.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key}
                onPress={() => type(key)}
                className="bg-foreground h-[44px] min-w-[34px] flex-1 items-center justify-center rounded-lg"
              >
                <Text kabiye className="text-background text-[20px]">
                  {key}
                </Text>
              </Pressable>
            ))}
          </View>

          {LATIN_ROWS.map((row, i) => (
            <View key={i} className="mb-[6px] flex-row justify-center gap-[5px]">
              {row.map((key) => (
                <Pressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={key}
                  onPress={() => type(key)}
                  className="bg-background h-[42px] min-w-[30px] flex-1 items-center justify-center rounded-md"
                >
                  <Text kabiye className="text-foreground text-[18px]">
                    {key}
                  </Text>
                </Pressable>
              ))}
              {i === 2 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t`Delete`}
                  onPress={backspace}
                  className="bg-border h-[42px] min-w-[44px] items-center justify-center rounded-md px-3"
                >
                  <Text className="text-foreground text-[16px]">⌫</Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          <View className="mt-1 flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t`Space`}
              onPress={() => type(' ')}
              className="bg-background h-[42px] flex-1 items-center justify-center rounded-md"
            >
              <Text className="text-foreground-secondary text-[14px]">{t`space`}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t`Check`}
              accessibilityState={{ disabled: written.length === 0 }}
              onPress={check}
              className={
                written.length === 0
                  ? 'bg-accent h-[42px] w-[96px] items-center justify-center rounded-md opacity-40'
                  : 'bg-accent h-[42px] w-[96px] items-center justify-center rounded-md'
              }
            >
              <Text className="text-[15px] font-semibold text-white">{t`Check`}</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="px-6 pb-8">
          <Button variant="primary" fullWidth onPress={() => onAnswer(checked, written)}>
            {t`Continue`}
          </Button>
        </View>
      )}
    </View>
  )
}

export default SpellStep
