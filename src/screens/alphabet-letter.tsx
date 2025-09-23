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

import Markdown from '@jonasmerlin/react-native-markdown-display'
import { useLingui } from '@lingui/react/macro'

import { CaretLeftIcon } from '@/components/icons'
import { Button, Card, Text, View } from '@/components/ui'
import { useAppAlphabetLetter } from '@/hooks/use-app-data'
import { brandColors, LETTER_TYPE_COLORS, MARKDOWN_STYLE } from '@/utils/design-system-nativewind'

// import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus'

export default function AlphabetLetterScreen() {
  const { t } = useLingui()
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
      <View flex className="bg-white dark:bg-gray-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">{t`Loading letter...`}</Text>
        </View>
      </View>
    )
  }

  if (error || !letter) {
    return (
      <View flex className="bg-white dark:bg-gray-900">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-center text-primary">
            {t`Letter not found`}
          </Text>
          <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
            {error?.message || t`This letter does not exist`}
          </Text>
        </View>
      </View>
    )
  }

  // Use the type from the database
  const letterType = letter.type

  return (
    <View flex className="bg-white dark:bg-gray-900" style={{ paddingBottom: 70 + safeAreaInsets.top }}>
      <Animated.View
        className="absolute left-0 top-0 z-10 w-full border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        style={[animatedHeaderStyle]}
      >
        <View style={{ height: safeAreaInsets.top }} />
        <View className="h-[70px] flex-row items-center justify-between px-2.5">
          <View>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" onPress={() => router.back()}>
              <CaretLeftIcon size={20} weight="bold" className="text-text-dark dark:text-gray-100" />
            </Button>
          </View>

          <Animated.View className="flex-1 pl-2.5" style={[animatedHeaderTitleStyle]}>
            <Text variant="lg" weight="medium" numberOfLines={1} className="text-text-dark dark:text-gray-100">
              {letter.letter} - {letter.letter.toUpperCase()}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <View center className="h-[200px]" style={{ paddingTop: safeAreaInsets.top }}>
          <Text variant="h1" weight="bold" className="mb-2.5 text-text-dark dark:text-gray-100">
            {letter.letter} - {letter.letter.toUpperCase()}
          </Text>
          <Card
            className="rounded-full px-5 py-2"
            style={{
              backgroundColor: LETTER_TYPE_COLORS[letterType as keyof typeof LETTER_TYPE_COLORS],
            }}
          >
            <Text variant="small" weight="medium" className="text-white">
              {letterType === 'vowel' ? t`Vowel` : letterType === 'consonant' ? t`Consonant` : t`Grapheme`}
            </Text>
          </Card>
        </View>
        <View className="px-4 py-2.5">
          <Markdown style={MARKDOWN_STYLE}>{letter.description_fr ?? ''}</Markdown>
        </View>
        <View className="h-[70px]" />
      </Animated.ScrollView>
    </View>
  )
}
