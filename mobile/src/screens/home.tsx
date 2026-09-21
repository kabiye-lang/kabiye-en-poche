import { useCallback, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, MagnifyingGlassIcon, PlayIcon } from '../components/icons'
import { Skeleton, Text, View } from '../components/ui'
import { useAppAlphabetLetters, useAppNextLesson, useAppUserProgress } from '../hooks/use-app-data'
import { useWordOfTheDay } from '../hooks/use-dictionary'
import { useLanguage } from '../hooks/use-language'
import { readLessonSessionSummary } from '../hooks/use-lesson-session'
import { useMyWords } from '../hooks/use-my-words'
import { resolveTranslation } from '../utils/dictionary-helpers'

/**
 * Home opens on resume and search -- the two things a learner returning to the app
 * wants first, in an app with no notifications to bring them back. The letter of the
 * week is still here, but editorial rather than the first thing the screen says (design
 * review 2026-09-21): the eight letters French cannot write, one per week, in the
 * language's own script.
 */
const WEEKLY_LETTERS = ['ɖ', 'ɛ', 'ɣ', 'ɩ', 'ŋ', 'ɔ', 'ʋ', 'ñ'] as const

/** Which letter this week's is. Rotates on a fixed cycle so it is the same for everyone. */
export function letterOfTheWeek(now: Date = new Date()): string {
  const week = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000))
  return WEEKLY_LETTERS[week % WEEKLY_LETTERS.length]
}

type SessionSummary = Awaited<ReturnType<typeof readLessonSessionSummary>>

/**
 * The one dominant action on Home: where to resume, or where to start.
 *
 * The eyebrow reads "Continue" once there is something to continue -- a saved session,
 * or at least one finished lesson -- and "Start here" the first time, before either is
 * true. The progress line prefers the saved session (it knows the exact step) and falls
 * back to the lesson's place in its unit when there is none to read.
 */
const ResumeCard = () => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const { data, isPending, isError, refetch } = useAppNextLesson()
  const { data: userProgress } = useAppUserProgress()
  const [summary, setSummary] = useState<SessionSummary>(null)

  const lessonId = data?.lesson.id

  // The session lives in AsyncStorage, not react-query's cache, so it is re-read by hand
  // whenever Home regains focus -- after finishing a lesson, or backing out of one.
  useFocusEffect(
    useCallback(() => {
      if (!lessonId) {
        setSummary(null)
        return
      }
      let cancelled = false
      void readLessonSessionSummary(lessonId).then((result) => {
        if (!cancelled) setSummary(result)
      })
      return () => {
        cancelled = true
      }
    }, [lessonId])
  )

  if (isPending) {
    return (
      <View className="mt-6 rounded-[18px] px-5 py-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-7 w-4/5" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </View>
    )
  }

  if (isError) {
    return (
      <View className="border-foreground mt-6 rounded-[18px] border-[1.5px] px-5 py-5">
        <Text className="text-foreground text-[17px]">{t`We could not load your next lesson.`}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => refetch()}
          className="bg-foreground mt-4 min-h-[44px] items-center justify-center self-start rounded-full px-5"
        >
          <Text weight="semibold" className="text-background text-[15px]">
            {t`Try again`}
          </Text>
        </Pressable>
      </View>
    )
  }

  // Nothing left to open: every written lesson on the path is done.
  if (!data) return null

  const { lesson, unitTitle, ordinal, writtenInUnit } = data
  const title = getValue(lesson, 'title') ?? ''
  const hasFinishedOne = (userProgress?.length ?? 0) >= 1
  const eyebrow = summary !== null || hasFinishedOne ? t`Continue` : t`Start here`

  const progressLine =
    summary?.kind === 'lesson'
      ? t`Step ${summary.current} of ${summary.total}`
      : summary?.kind === 'review'
        ? t`Review`
        : t`Lesson ${ordinal} of ${writtenInUnit} · ${getValue(unitTitle, 'title') ?? ''}`

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow}, ${title}, ${progressLine}`}
      onPress={() => router.push(`/lesson/${lesson.id}`)}
      className="bg-foreground mt-6 rounded-[18px] px-5 py-5"
    >
      <View className="flex-row items-center justify-between">
        <Text weight="semibold" className="text-accent-on-ink text-[13px] uppercase tracking-[0.1em]">
          {eyebrow}
        </Text>
        {/* Decorative -- the whole card is the pressable, well past 44pt tall, so this
            circle does not need its own hit area (see the same choice in learn.tsx). */}
        <View className="bg-accent-fill h-9 w-9 items-center justify-center rounded-full">
          <PlayIcon size={16} weight="fill" className="text-on-accent" />
        </View>
      </View>
      <Text weight="semibold" numberOfLines={2} className="text-background mt-2 text-[22px] leading-[1.15]">
        {title}
      </Text>
      <Text className="text-background/60 mt-1 text-[15px]">{progressLine}</Text>
    </Pressable>
  )
}

const HomeScreen = () => {
  const { t } = useLingui()
  const { getValue, currentLanguage } = useLanguage()
  const { data: letters } = useAppAlphabetLetters()
  const { data: wordOfTheDay } = useWordOfTheDay(1)
  const myWords = useMyWords()
  const params = useLocalSearchParams<{ letter?: string }>()

  // Dev-only: lets a screenshot pin the letter instead of waiting for its week. Never
  // reachable in a production build, where __DEV__ is always false.
  const devLetter = __DEV__ ? params.letter : undefined
  const letter = devLetter || letterOfTheWeek()
  const letterRow = letters?.find((l) => l.id === letter)
  const explainer = letterRow ? getValue(letterRow, 'pronunciation') : null

  // The hook groups homographs, so the word of the day is a group whose first entry
  // carries the headword and senses.
  const group = wordOfTheDay?.[0]
  const entry = group?.entries[0]
  const headword = entry?.entry_data.headword
  const firstDefinition = entry?.entry_data.senses[0]?.definitions[0]
  const resolved = entry
    ? resolveTranslation(
        firstDefinition?.translations,
        currentLanguage === 'fr' ? 'fr' : 'en',
        '',
        firstDefinition?.machine
      )
    : null
  const gloss = resolved?.text || null
  const isFallback = Boolean(resolved?.isFallback)
  const isMachine = Boolean(resolved?.isMachine)

  return (
    <View flex safeArea="top" className="bg-background">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-2" showsVerticalScrollIndicator={false}>
        <Text weight="semibold" className="text-foreground text-[14px]">
          {t`Kabiyè en Poche`}
        </Text>

        <ResumeCard />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t`Search the dictionary`}
          onPress={() => router.push({ pathname: '/(tabs)/dictionary', params: { focus: String(Date.now()) } })}
          className="bg-background-tertiary mt-4 h-[52px] flex-row items-center rounded-[14px] px-4"
        >
          <MagnifyingGlassIcon size={20} className="text-foreground-secondary mr-3" />
          {/* text-foreground-secondary on paper is 5.56:1; on this recessed tray it is
              4.98:1 -- still clear of the 4.5:1 AA floor for this size. */}
          <Text className="text-foreground-secondary text-[16px]">{t`Search the dictionary`}</Text>
        </Pressable>

        <View className="mt-4 flex-row flex-wrap gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/(home)/alphabet')}
            className="border-foreground min-h-[44px] flex-row items-center rounded-full border-[1.5px] px-[18px] py-3"
          >
            <Text weight="semibold" className="text-foreground text-[15px]">{t`Alphabet`}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/dictionary/my-words')}
            className="border-foreground min-h-[44px] flex-row items-center rounded-full border-[1.5px] px-[18px] py-3"
          >
            <Text weight="semibold" className="text-foreground text-[15px]">
              {myWords.savedCount > 0 ? t`My words · ${myWords.savedCount}` : t`My words`}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/keyboard')}
            className="border-foreground min-h-[44px] flex-row items-center rounded-full border-[1.5px] px-[18px] py-3"
          >
            <Text weight="semibold" className="text-foreground text-[15px]">{t`Keyboard`}</Text>
          </Pressable>
        </View>

        <View className="relative mt-10">
          {/* The same letter the section is about, oversized behind it at 8%. Scoped to
              this block rather than the whole screen -- at full-page size over 44pt
              targets it made the header read as a smudge rather than a letterform. */}
          <View
            className="absolute -right-8 -top-6 opacity-[0.08]"
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Text kabiye weight="bold" className="text-accent text-[240px] leading-[1]">
              {letter}
            </Text>
          </View>

          <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">
            {t`Letter of the week`}
          </Text>

          {/* leading-[0.85]-equivalent line height plus a negative margin buys back the
              overhang 96px crops off the capital's top, without moving the explainer. */}
          <Animated.View entering={FadeInDown.duration(600)} className="mt-1 overflow-visible">
            <Text
              kabiye
              weight="bold"
              className="text-foreground text-[96px]"
              style={{ lineHeight: 108, marginTop: -6, marginBottom: -6 }}
            >
              {letter.toUpperCase() === letter ? letter : `${letter.toUpperCase()}${letter}`}
            </Text>
          </Animated.View>

          {explainer ? (
            <Text className="text-foreground mt-4 max-w-[320px] text-[17px] leading-[1.3]">{explainer}</Text>
          ) : null}
        </View>

        {headword ? (
          <View className="border-foreground mt-12 border-t-[1.5px] pt-5">
            <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Today`}</Text>
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
                    ) : isMachine ? (
                      <View className="bg-background-tertiary rounded-[4px] px-2 py-[2px]">
                        <Text weight="bold" className="text-foreground-secondary text-[11px]">
                          {t`translated`}
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
