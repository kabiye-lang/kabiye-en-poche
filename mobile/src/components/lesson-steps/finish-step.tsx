import type { LessonExample } from '../../types/lesson-steps'

import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { ArrowRightIcon, BookmarkSimpleIcon } from '../icons'
import { Button, Text, View } from '../ui'

interface FinishStepProps {
  /** Taught words whose own paired activity was answered, right or wrong. */
  practised: LessonExample[]
  /** Taught words with no answered activity of their own -- shown, not tried. */
  metOnly: LessonExample[]
  /** Words that were missed once and came back. Named, not counted against the learner. */
  retried: string[]
  savedTotal?: number
  /** One sentence to go and do in a Kabiyè-speaking community this week -- the lesson
   *  leaving the phone. Learned from the Peace Corps workbook's TDA. */
  tda?: string
  onDone: () => void
  isBusy?: boolean
}

/**
 * What was practised, and what was only met.
 *
 * The old completion screen claimed every taught word was one the learner could read
 * and write, whether or not they were ever asked about it -- a claim the app has no
 * evidence for. Laterite instead counts only the words whose own paired activity was
 * answered ("practised"); anything taught but never tried is named separately, under
 * "Words you met", never folded into the same claim. A retry is a thing that happened,
 * not a deduction -- "One came back for a second try. You got it."
 */
const FinishStep = ({ practised, metOnly, retried, savedTotal, tda, onDone, isBusy }: FinishStepProps) => {
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()

  const practisedCount = practised.length
  // Nothing was practised: the headline falls back to what was met, so the lesson never
  // reports zero words for a lesson that did teach some.
  const headlineCount = practisedCount > 0 ? practisedCount : metOnly.length
  // The met words are always listed -- every one links to its entry. Only their label
  // depends on the mix: with nothing practised, the headline already says "met".
  const labelMetSection = practisedCount > 0 && metOnly.length > 0

  return (
    <View className="bg-accent-fill flex-1">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-8 pt-6" showsVerticalScrollIndicator={false}>
        <Text className="text-on-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Done`}</Text>

        <Text weight="semibold" className="text-on-accent mt-4 text-[40px] leading-[1.0]">
          {practisedCount > 0
            ? headlineCount === 1
              ? t`You practised one word.`
              : t`You practised ${headlineCount} words.`
            : headlineCount === 1
              ? t`You met one word.`
              : t`You met ${headlineCount} words.`}
        </Text>

        {retried.length > 0 ? (
          <Text className="text-on-accent mt-4 text-[17px] leading-[1.5]">
            {retried.length === 1
              ? t`One came back for a second try: ${retried[0]}. You got it.`
              : t`${retried.length} came back for a second try. You got them.`}
          </Text>
        ) : null}

        <View className="mt-8">
          {practised.map((word, i) => (
            <WordRow key={`practised-${word.kbp}-${i}`} word={word} index={i} currentLanguage={currentLanguage} />
          ))}
        </View>

        {labelMetSection ? (
          <Text className="text-on-accent mt-6 text-[13px] font-semibold uppercase tracking-[0.1em]">
            {t`Words you met`}
          </Text>
        ) : null}
        {metOnly.length > 0 ? (
          <View className={labelMetSection ? 'mt-2' : ''}>
            {metOnly.map((word, i) => (
              <WordRow key={`met-${word.kbp}-${i}`} word={word} index={i} currentLanguage={currentLanguage} />
            ))}
          </View>
        ) : null}

        {tda ? (
          // The lesson leaving the phone: one thing to go and do with a Kabiyè speaker.
          <View className="mt-8 border-l-[3px] border-white/60 pl-4">
            <Text className="text-on-accent text-[12px] font-semibold uppercase tracking-[0.1em]">{t`This week`}</Text>
            <Text className="text-on-accent mt-1.5 text-[16px] leading-[1.5]">{tda}</Text>
          </View>
        ) : null}

        {savedTotal !== undefined ? (
          <View className="mt-6 flex-row items-center gap-2">
            <BookmarkSimpleIcon size={16} className="text-on-accent" />
            <Text className="text-on-accent text-[13px]">{t`Saved to My words · ${savedTotal} so far`}</Text>
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

/** One word row: the Kabiyè headword, its gloss, and a link to the dictionary entry.
 *  Shared between the practised list and the "Words you met" list -- same row style. */
function WordRow({ word, index, currentLanguage }: { word: LessonExample; index: number; currentLanguage: string }) {
  return (
    <Animated.View entering={FadeInUp.duration(240).delay(index * 60)}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${word.kbp}, ${currentLanguage === 'fr' ? word.fr : word.en}`}
        onPress={() => router.push(`/word/${encodeURIComponent(word.kbp)}`)}
        className={
          index === 0
            ? 'flex-row items-baseline justify-between py-3'
            : 'flex-row items-baseline justify-between border-t border-white/30 py-3'
        }
      >
        <Text kabiye weight="bold" className="text-on-accent flex-1 text-[24px]">
          {word.kbp}
        </Text>
        <Text className="text-on-accent ml-4 max-w-[42%] text-right text-[15px]">
          {currentLanguage === 'fr' ? word.fr : word.en}
        </Text>
        <ArrowRightIcon size={16} className="text-on-accent ml-3" />
      </Pressable>
    </Animated.View>
  )
}

export default FinishStep
