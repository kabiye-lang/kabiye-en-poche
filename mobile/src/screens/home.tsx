import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Link, router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, MagnifyingGlassIcon, PlayIcon } from '../components/icons'
import { Text, View } from '../components/ui'
import { useAppAlphabetLetters, useAppNextLesson } from '../hooks/use-app-data'
import { useWordOfTheDay } from '../hooks/use-dictionary'
import { useLanguage } from '../hooks/use-language'
import { resolveTranslation } from '../utils/dictionary-helpers'

/**
 * The eight letters French cannot write, one per week.
 *
 * Home used to open on a "Continue Learning" card, which is a to-do list: it tells the
 * learner what they have not finished. Laterite opens on a letter instead -- the thing
 * the app is for, at 150px, in the language's own script. Resuming is still one tap, but
 * it is no longer the first thing the screen says.
 */
const WEEKLY_LETTERS = ['ɖ', 'ɛ', 'ɣ', 'ɩ', 'ŋ', 'ɔ', 'ʋ', 'ñ'] as const

/** Which letter this week's is. Rotates on a fixed cycle so it is the same for everyone. */
export function letterOfTheWeek(now: Date = new Date()): string {
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))
  return WEEKLY_LETTERS[week % WEEKLY_LETTERS.length]
}

const HomeScreen = () => {
  const { t } = useLingui()
  const { getValue, currentLanguage } = useLanguage()
  const { data: nextLesson } = useAppNextLesson()
  const { data: letters } = useAppAlphabetLetters()
  const { data: wordOfTheDay } = useWordOfTheDay(1)

  const letter = letterOfTheWeek()
  const letterRow = letters?.find((l) => l.id === letter)
  const explainer = letterRow ? getValue(letterRow, 'pronunciation') : null

  // The hook groups homographs, so the word of the day is a group whose first entry
  // carries the headword and senses.
  const group = wordOfTheDay?.[0]
  const entry = group?.entries[0]
  const headword = entry?.entry_data.headword
  const resolved = entry
    ? resolveTranslation(
        entry.entry_data.senses[0]?.definitions[0]?.translations,
        currentLanguage === 'fr' ? 'fr' : 'en'
      )
    : null
  const gloss = resolved?.text || null
  const isFallback = Boolean(resolved?.isFallback)

  return (
    <View flex safeArea="top" className="bg-background">
      {/* The same letter the page is about, oversized behind the content at 8%. It sits
          below the wordmark rather than behind it -- at 13% over the header it read as a
          smudge on the status bar rather than as the letterform. */}
      <View
        className="absolute -right-16 top-32 opacity-[0.08]"
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text kabiye weight="bold" className="text-accent text-[380px] leading-[1]">
          {letter}
        </Text>
      </View>

      <ScrollView contentContainerClassName="px-6 pb-8 pt-2" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <Text weight="semibold" className="text-foreground text-[14px]">
            {t`Kabiyè en Poche`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t`Search the dictionary`}
            onPress={() => router.push('/(tabs)/dictionary')}
            className="border-foreground h-9 w-9 items-center justify-center rounded-full border-[1.5px]"
          >
            <MagnifyingGlassIcon size={16} className="text-foreground" />
          </Pressable>
        </View>

        <Text className="text-accent mt-10 text-[13px] font-semibold uppercase tracking-[0.1em]">
          {t`Letter of the week`}
        </Text>

        {/* leading-[0.85] is the design's line-height, and at 150px it crops the capital's
            top. The extra line box plus a negative margin buys the overhang back without
            moving anything below. */}
        <Animated.View entering={FadeInDown.duration(600)} className="mt-1 overflow-visible">
          <Text
            kabiye
            weight="bold"
            className="text-foreground text-[150px]"
            style={{ lineHeight: 170, marginTop: -10, marginBottom: -14 }}
          >
            {letter.toUpperCase() === letter ? letter : `${letter.toUpperCase()}${letter}`}
          </Text>
        </Animated.View>

        {explainer ? (
          <Text className="text-foreground mt-4 max-w-[320px] text-[24px] leading-[1.2]">{explainer}</Text>
        ) : null}

        <View className="mt-7 flex-row flex-wrap gap-3">
          {nextLesson ? (
            <Link href={`/lesson/${nextLesson.id}`} asChild>
              <Pressable
                accessibilityRole="button"
                className="bg-foreground flex-row items-center gap-2 rounded-full px-[18px] py-3"
              >
                <PlayIcon size={14} weight="fill" className="text-background" />
                <Text weight="semibold" className="text-background text-[15px]">
                  {getValue(nextLesson, 'title') ?? t`Continue`}
                </Text>
              </Pressable>
            </Link>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/(home)/alphabet')}
            className="border-foreground flex-row items-center rounded-full border-[1.5px] px-[18px] py-3"
          >
            <Text weight="semibold" className="text-foreground text-[15px]">{t`Alphabet`}</Text>
          </Pressable>
        </View>

        {headword ? (
          <View className="border-foreground mt-12 border-t-[1.5px] pt-5">
            <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Today`}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${headword}${gloss ? `, ${gloss}` : ''}`}
              onPress={() => router.push(`/word/${encodeURIComponent(headword)}`)}
              className="mt-2 flex-row items-baseline justify-between"
            >
              <View className="flex-1">
                <Text kabiye weight="bold" className="text-foreground text-[28px]">
                  {headword}
                </Text>
                {gloss ? (
                  <View className="mt-1 flex-row items-center gap-2">
                    <Text className="text-foreground-secondary flex-1 text-[15px]">{gloss}</Text>
                    {/* The dictionary is French-first; about a quarter of entries have no
                        English gloss. Showing the French and saying so beats hiding the word. */}
                    {isFallback ? (
                      <View className="bg-background-tertiary rounded-[4px] px-2 py-[2px]">
                        <Text weight="bold" className="text-foreground-secondary text-[11px]">
                          {resolved?.language?.toUpperCase() ?? 'FR'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
              <CaretRightIcon size={16} className="text-foreground-secondary ml-3" />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

export default HomeScreen
