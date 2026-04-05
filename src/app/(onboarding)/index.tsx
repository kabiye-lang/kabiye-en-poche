import { useRef, useState } from 'react'
import { Dimensions, FlatList, TouchableOpacity } from 'react-native'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Gradient, Text, View } from '@/components/ui'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const ONBOARDING_KEY = '@kabiye_onboarding_complete'

interface OnboardingPage {
  id: string
  emoji: string
  titleKey: string
  descriptionKey: string
  gradientColors: [string, string]
}

const OnboardingScreen = () => {
  const { t } = useLingui()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const pages: OnboardingPage[] = [
    {
      id: '1',
      emoji: '🌍',
      titleKey: t`Discover Kabiyè`,
      descriptionKey: t`Explore a rich West African language spoken by millions. Learn words, phrases, and the beautiful Kabiyè alphabet.`,
      gradientColors: ['#1B6B3C', '#2A8B55'],
    },
    {
      id: '2',
      emoji: '📖',
      titleKey: t`Your Personal Dictionary`,
      descriptionKey: t`Look up any Kabiyè word instantly. Browse by letter, search in French or English, and discover the Word of the Day.`,
      gradientColors: ['#C8922A', '#D4A843'],
    },
    {
      id: '3',
      emoji: '⌨️',
      titleKey: t`Type in Kabiyè`,
      descriptionKey: t`Use the built-in Kabiyè keyboard to type special characters. Copy text and share it anywhere.`,
      gradientColors: ['#1B6B3C', '#C8922A'],
    },
  ]

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    router.replace('/(tabs)')
  }

  const goToNext = () => {
    if (currentIndex < pages.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true })
    } else {
      completeOnboarding()
    }
  }

  const renderPage = ({ item }: { item: OnboardingPage }) => (
    <View style={{ width: SCREEN_WIDTH }} className="flex-1 justify-center px-8">
      <Gradient colors={item.gradientColors}>
        <View className="mx-4 my-8 items-center rounded-3xl p-8">
          <Text className="mb-4 text-6xl">{item.emoji}</Text>
          <Text variant="h3" weight="bold" className="mb-3 text-center text-white">
            {item.titleKey}
          </Text>
          <Text variant="body" className="text-center leading-6 text-white/85">
            {item.descriptionKey}
          </Text>
        </View>
      </Gradient>
    </View>
  )

  return (
    <View flex safeArea="all" className="bg-background">
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          setCurrentIndex(index)
        }}
        className="flex-1"
      />

      {/* Pagination + Actions */}
      <View className="items-center px-8 pb-8">
        {/* Dots */}
        <View className="mb-6 flex-row items-center gap-2">
          {pages.map((_, i) => (
            <View key={i} className={`h-2 rounded-full ${i === currentIndex ? 'bg-primary w-6' : 'bg-border w-2'}`} />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity onPress={goToNext} className="bg-primary w-full items-center rounded-full py-4">
          <Text variant="body" weight="semibold" className="text-primary-foreground">
            {currentIndex === pages.length - 1 ? t`Get Started` : t`Next`}
          </Text>
        </TouchableOpacity>

        {/* Skip */}
        {currentIndex < pages.length - 1 && (
          <TouchableOpacity onPress={completeOnboarding} className="mt-3 py-2">
            <Text variant="body" className="text-foreground-secondary">
              {t`Skip`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default OnboardingScreen
