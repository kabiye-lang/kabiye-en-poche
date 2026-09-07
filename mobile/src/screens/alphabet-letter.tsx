import { Pressable } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretLeftIcon } from '../components/icons'
import { AppMarkdown } from '../components/markdown'
import { Button, Text, View } from '../components/ui'
import { useAppAlphabetLetter, useAppAlphabetLetters } from '../hooks/use-app-data'
import { useEntriesByLetter } from '../hooks/use-dictionary'
import { useLanguage } from '../hooks/use-language'
import { useMyWords } from '../hooks/use-my-words'
import { brandColors, MARKDOWN_STYLE } from '../utils/design-system-nativewind'

// import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus'

export default function AlphabetLetterScreen() {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const { letter: letterParam } = useLocalSearchParams()
  const safeAreaInsets = useSafeAreaInsets()

  const letterId = letterParam ? decodeURI(letterParam as string) : ''
  const { data: letter, isLoading, error } = useAppAlphabetLetter(letterId)
  const { data: alphabet } = useAppAlphabetLetters()
  const { words: myWords } = useMyWords()
  const { data: entriesByLetter } = useEntriesByLetter(letterId)

  // "In words you know" means exactly that where it can: the learner's own list, filtered
  // to the words this letter appears in. It falls back to the dictionary so the section
  // is never empty on a first run -- both sources are attested, neither is invented.
  const known = myWords.filter((word) => word.headword.toLowerCase().includes(letterId.toLowerCase())).slice(0, 4)
  const examples = known.length
    ? known.map((word) => word.headword)
    : (entriesByLetter?.pages[0] || []).slice(0, 4).map((entry) => entry.headword)

  const position = alphabet?.findIndex((entry) => entry.id === letterId) ?? -1
  const next = position >= 0 && alphabet ? alphabet[position + 1] : undefined

  const sv = useSharedValue<number>(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet'
      sv.value = event.contentOffset.y
    },
  })
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(sv.value, [0, 100, 200], ['transparent', 'transparent', brandColors.textLight]),
      borderBottomWidth: interpolate(sv.value, [0, 120, 220], [0, 0, 1]),
    }
  })
  const animatedHeaderTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(sv.value, [0, 220, 250], [0, 0, 1]),
    }
  })

  // Bone blocks in the shape of what is coming, never a spinner: the page is one huge
  // letter and a paragraph, and the skeleton can say exactly that.
  if (isLoading) {
    return (
      <View flex className="bg-background" style={{ paddingTop: safeAreaInsets.top + 70 }}>
        <View className="px-6">
          <View className="bg-background-tertiary h-[150px] w-[220px] rounded-xl" />
          <View className="mt-6 flex-row gap-2">
            <View className="bg-background-tertiary h-10 w-28 rounded-full" />
            <View className="bg-background-tertiary h-10 w-32 rounded-full" />
          </View>
          <View className="bg-background-tertiary mt-8 h-5 w-full rounded-md" />
          <View className="bg-background-tertiary mt-3 h-5 w-4/5 rounded-md" />
        </View>
      </View>
    )
  }

  if (error || !letter) {
    return (
      <View flex className="bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-primary text-center">
            {t`Letter not found`}
          </Text>
          <Text variant="caption" className="text-foreground mt-2 text-center">
            {error?.message || t`This letter does not exist`}
          </Text>
        </View>
      </View>
    )
  }

  // Use the type from the database
  const letterType = letter.type
  // From the alphabet table, in whichever language the interface is in.
  const description = getValue(letter, 'description')

  /** The letters French cannot write; the only ones that earn the filled pill. */
  const KABIYE_ONLY = 'ɖƉɛƐɣƔɩƖŋŊɔƆʋƲñÑ'

  return (
    <View flex className="bg-background" style={{ paddingBottom: 70 + safeAreaInsets.top }}>
      <Animated.View
        className="border-border bg-background absolute top-0 left-0 z-10 w-full border-b"
        style={[animatedHeaderStyle]}
      >
        <View style={{ height: safeAreaInsets.top }} />
        <View className="h-[70px] flex-row items-center justify-between px-2.5">
          <View>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" onPress={() => router.back()}>
              <CaretLeftIcon size={20} weight="bold" className="text-foreground" />
            </Button>
          </View>

          <Animated.View className="flex-1 pl-2.5" style={[animatedHeaderTitleStyle]}>
            <Text kabiye variant="lg" weight="medium" numberOfLines={1} className="text-foreground">
              {letter.id.toUpperCase()} {letter.id}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <View className="px-6" style={{ paddingTop: safeAreaInsets.top + 70 }}>
          {/* The pair, at 150. Capital in ink, lowercase in laterite -- the same letter
              twice is the thing a learner has to recognise, and the colour split is what
              makes the two readable as one letter rather than two. */}
          <View className="flex-row items-baseline gap-3">
            <Text kabiye weight="bold" className="text-foreground text-[150px]" style={{ lineHeight: 165 }}>
              {letter.id.toUpperCase()}
            </Text>
            <Text kabiye className="text-accent text-[150px]" style={{ lineHeight: 165 }}>
              {letter.id}
            </Text>
          </View>

          <View className="mt-2 flex-row flex-wrap gap-2">
            <View className="border-foreground rounded-full border-[1.5px] px-4 py-2">
              <Text weight="semibold" className="text-foreground text-[15px]">
                {letterType === 'vowel' ? t`Vowel` : letterType === 'consonant' ? t`Consonant` : t`Grapheme`}
              </Text>
            </View>
            {/* The distinction the app exists to teach earns the filled pill. */}
            {KABIYE_ONLY.includes(letter.id) ? (
              <View className="bg-accent rounded-full px-4 py-2">
                <Text weight="semibold" className="text-[15px] text-white">{t`Not in French`}</Text>
              </View>
            ) : null}
          </View>

          {/* `description_*` opens with a "Pronunciation" section carrying this same
              sentence, so printing `pronunciation_*` above it said everything twice. */}
          <View className="border-foreground mt-8 mb-6 border-t-[1.5px]" />
        </View>

        <View className="px-6">
          {/* The description used to be hard-coded to `description_fr`, so an English
              reader got French prose on the screen teaching them to read. */}
          <AppMarkdown style={MARKDOWN_STYLE}>{description ?? ''}</AppMarkdown>
        </View>

        {examples.length > 0 ? (
          <View className="mt-8 px-6">
            <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">
              {known.length ? t`In words you know` : t`In words`}
            </Text>
            <View className="mt-3">
              {examples.map((headword) => (
                <Pressable
                  key={headword}
                  accessibilityRole="button"
                  onPress={() => router.push(`/word/${headword}`)}
                  className="border-border border-b py-4"
                >
                  <HighlightedWord word={headword} letter={letterId} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Write it, or move on. Both are the actions this screen leads to; neither is
            a decoration, so they sit at the end of the page rather than in a bar. */}
        <View className="mt-8 flex-row gap-3 px-6">
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.push(`/keyboard?text=${encodeURIComponent(letterId)}`)}
          >
            <Text weight="semibold" className="text-foreground text-[16px]">{t`Write it`}</Text>
          </Button>
          {next ? (
            <Button className="flex-1" onPress={() => router.replace(`/alphabet/${encodeURIComponent(next.id)}`)}>
              <Text kabiye weight="semibold" className="text-background text-[16px]">
                {t`Next`} {next.id.toUpperCase()} {next.id}
              </Text>
            </Button>
          ) : null}
        </View>
        <View className="h-[70px]" />
      </Animated.ScrollView>
    </View>
  )
}

/**
 * The word with this letter picked out in laterite.
 *
 * A learner scanning for `ɩ` inside `Kabɩyɛ` is doing the exact discrimination the
 * screen teaches, so the letter is coloured rather than left for them to find.
 */
function HighlightedWord({ word, letter }: { word: string; letter: string }) {
  const parts = word.split(new RegExp(`(${letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))

  return (
    <Text kabiye weight="bold" className="text-foreground text-[24px] leading-[1.15]">
      {parts.map((part, index) =>
        part.toLowerCase() === letter.toLowerCase() ? (
          <Text key={index} kabiye weight="bold" className="text-accent text-[24px]">
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  )
}
