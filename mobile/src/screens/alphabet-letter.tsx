import { ActivityIndicator } from 'react-native'
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
import { useAppAlphabetLetter } from '../hooks/use-app-data'
import { useLanguage } from '../hooks/use-language'
import { brandColors, MARKDOWN_STYLE } from '../utils/design-system-nativewind'

// import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus'

export default function AlphabetLetterScreen() {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const { letter: letterParam } = useLocalSearchParams()
  const safeAreaInsets = useSafeAreaInsets()

  const letterId = letterParam ? decodeURI(letterParam as string) : ''
  const { data: letter, isLoading, error } = useAppAlphabetLetter(letterId)

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

  if (isLoading) {
    return (
      <View flex className="bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">{t`Loading letter...`}</Text>
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
  // Both come from the alphabet table in whichever language the interface is in.
  const description = getValue(letter, 'description')
  const pronunciation = getValue(letter, 'pronunciation')

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

          {pronunciation ? (
            <Text className="text-foreground mt-6 text-[18px] leading-[1.5]">{pronunciation}</Text>
          ) : null}

          <View className="border-foreground my-6 border-t-[1.5px]" />
        </View>

        <View className="px-6">
          {/* The description used to be hard-coded to `description_fr`, so an English
              reader got French prose on the screen teaching them to read. */}
          <AppMarkdown style={MARKDOWN_STYLE}>{description ?? ''}</AppMarkdown>
        </View>
        <View className="h-[70px]" />
      </Animated.ScrollView>
    </View>
  )
}
