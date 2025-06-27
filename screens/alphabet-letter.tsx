import { useTranslation } from 'react-i18next'
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge, Colors } from 'react-native-ui-lib'

import { router, useLocalSearchParams } from 'expo-router'

import Markdown from '@jonasmerlin/react-native-markdown-display'

import { CaretLeftIcon } from '@/components/icons'
import { Button, Text, View } from '@/components/themed'
import alphabetList from '@/utils/data/alphabet.json'
import { LETTER_TYPE_COLORS, MARKDOWN_STYLE } from '@/utils/design-system'

// import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus'

export default function AlphabetLetterScreen() {
  const { t } = useTranslation()
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
      <View flex paddingT-20 useSafeArea>
        <Text paddingT-20>{t('common.error.general')}</Text>
      </View>
    )
  }

  return (
    <View flex style={{ paddingBottom: 70 + safeAreaInsets.top, backgroundColor: Colors.white }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            backgroundColor: Colors.white,
            zIndex: 10,
            borderBottomColor: Colors.$textDisabled,
          },
          animatedHeaderStyle,
        ]}
      >
        <View style={{ height: safeAreaInsets.top }} />
        <View
          style={[
            {
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              height: 70,
              paddingHorizontal: 10,
            },
          ]}
        >
          <View>
            <Button
              title={t('common.labels.back')}
              round
              iconSource={() => <CaretLeftIcon size={20} weight="bold" color={Colors.black} />}
              backgroundColor={Colors.white}
              style={{ width: 30, height: 30 }}
              onPress={() => router.back()}
            />
          </View>

          <Animated.View
            style={[
              {
                flex: 1,
                paddingLeft: 10,
              },
              animatedHeaderTitleStyle,
            ]}
          >
            <Text numberOfLines={1} lg family="fig5">
              {letter?.id} - {letter?.caps}
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <View center style={{ height: 200, paddingTop: safeAreaInsets.top }}>
          <Text h1 marginB-10>
            {letter?.id} - {letter?.caps}
          </Text>
          <Badge
            // @ts-expect-error string not found
            label={t(`alphabet.letter_type.${letter.type}`)}
            size={32}
            labelStyle={{ paddingHorizontal: 20 }}
            // @ts-expect-error string index
            backgroundColor={LETTER_TYPE_COLORS[letter.type]}
          />
        </View>
        <View paddingV-10 paddingH-15>
          <Markdown style={MARKDOWN_STYLE}>{letter.description_fr ?? ''}</Markdown>
        </View>
        <View style={{ height: 70 }} />
      </Animated.ScrollView>
    </View>
  )
}
