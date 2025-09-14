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
import alphabetList from '@/utils/data/alphabet.json'
import { LETTER_TYPE_COLORS, MARKDOWN_STYLE } from '@/utils/design-system-nativewind'

// import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus'

export default function AlphabetLetterScreen() {
  const { t } = useLingui()
  const { letter: letterParam } = useLocalSearchParams()
  const safeAreaInsets = useSafeAreaInsets()

  const letter = letterParam ? alphabetList.find((item) => item.id === decodeURI(letterParam as string)) : null

  const sv = useSharedValue<number>(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet'
      sv.value = event.contentOffset.y
    },
  })
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(sv.value, [0, 100, 200], ['transparent', 'transparent', '#FFFFFF']),
      borderBottomWidth: interpolate(sv.value, [0, 120, 220], [0, 0, 1]),
    }
  })
  const animatedHeaderTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(sv.value, [0, 220, 250], [0, 0, 1]),
    }
  })

  if (!letter) {
    return (
      <View flex className="pt-5">
        <Text className="pt-5">{t`An error occurred...`}</Text>
      </View>
    )
  }

  return (
    <View flex className="bg-white" style={{ paddingBottom: 70 + safeAreaInsets.top }}>
      <Animated.View
        className="absolute left-0 top-0 z-10 w-full border-b border-gray-200 bg-white"
        style={[animatedHeaderStyle]}
      >
        <View style={{ height: safeAreaInsets.top }} />
        <View className="h-[70px] flex-row items-center justify-between px-2.5">
          <View>
            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" onPress={() => router.back()}>
              <CaretLeftIcon size={20} weight="bold" color="#000000" />
            </Button>
          </View>

          <Animated.View className="flex-1 pl-2.5" style={[animatedHeaderTitleStyle]}>
            <Text variant="lg" weight="medium" numberOfLines={1}>
              {letter?.id} - {letter?.caps}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <View center className="h-[200px]" style={{ paddingTop: safeAreaInsets.top }}>
          <Text variant="h1" weight="bold" className="mb-2.5">
            {letter?.id} - {letter?.caps}
          </Text>
          <Card
            className="rounded-full px-5 py-2"
            style={{
              backgroundColor: LETTER_TYPE_COLORS[letter.type as keyof typeof LETTER_TYPE_COLORS],
            }}
          >
            <Text variant="small" weight="medium" color="white">
              {letter.type === 'vowel' ? t`Vowel` : letter.type === 'consonant' ? t`Consonant` : t`Grapheme`}
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
