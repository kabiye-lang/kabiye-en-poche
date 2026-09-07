import type { LessonExample } from '../../types/lesson-steps'

import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { ArrowRightIcon, BookmarkSimpleIcon } from '../icons'
import { Button, Text, View } from '../ui'

interface FinishStepProps {
  words: LessonExample[]
  /** Words that were missed once and came back. Named, not counted against the learner. */
  retried: string[]
  savedTotal?: number
  onDone: () => void
  isBusy?: boolean
}

/**
 * What you can now read, not how you scored.
 *
 * The old completion screen showed a percentage over a question count. That measured the
 * app's exercises rather than the learner's Kabiyè, and a low number at the end of a
 * lesson someone had just worked through is a strange thing to hand them. Laterite
 * counts words instead, and treats a retry as a thing that happened rather than a
 * deduction -- "One came back for a second try. You got it."
 */
const FinishStep = ({ words, retried, savedTotal, onDone, isBusy }: FinishStepProps) => {
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()

  const count = words.length

  return (
    <View className="bg-accent flex-1">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/80">{t`Done`}</Text>

        <Text weight="semibold" className="mt-4 text-[40px] leading-[1.0] text-white">
          {count === 1
            ? t`One word you can now read and write.`
            : t`${count} words you can now read and write.`}
        </Text>

        {retried.length > 0 ? (
          <Text className="mt-4 text-[17px] leading-[1.5] text-white/90">
            {retried.length === 1
              ? t`One came back for a second try: ${retried[0]}. You got it.`
              : t`${retried.length} came back for a second try. You got them.`}
          </Text>
        ) : null}

        <View className="mt-8">
          {words.map((word, i) => (
            <Animated.View key={`${word.kbp}-${i}`} entering={FadeInUp.duration(240).delay(i * 60)}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${word.kbp}, ${currentLanguage === 'fr' ? word.fr : word.en}`}
                onPress={() => router.push(`/word/${encodeURIComponent(word.kbp)}`)}
                className={
                  i === 0
                    ? 'flex-row items-baseline justify-between py-3'
                    : 'flex-row items-baseline justify-between border-t border-white/30 py-3'
                }
              >
                <Text kabiye weight="bold" className="flex-1 text-[24px] text-white">
                  {word.kbp}
                </Text>
                <Text className="ml-4 max-w-[42%] text-right text-[15px] text-white/80">
                  {currentLanguage === 'fr' ? word.fr : word.en}
                </Text>
                <ArrowRightIcon size={16} className="ml-3 text-white/80" />
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {savedTotal !== undefined ? (
          <View className="mt-6 flex-row items-center gap-2">
            <BookmarkSimpleIcon size={16} className="text-white/70" />
            <Text className="text-[13px] text-white/70">{t`Saved to My words · ${savedTotal} so far`}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row gap-3 px-6 pb-8">
        <Button variant="outline" className="flex-1" onPress={() => router.back()}>
          {t`Back to path`}
        </Button>
        <Button variant="primary" className="flex-[1.2]" onPress={onDone} disabled={isBusy}>
          {t`Next lesson`}
        </Button>
      </View>
    </View>
  )
}

export default FinishStep
