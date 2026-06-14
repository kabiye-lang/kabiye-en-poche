import { useRef, useState } from 'react'
import { Dimensions, FlatList, Pressable } from 'react-native'
import { EaseView } from 'react-native-ease'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { Text, View } from '../../components/ui'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const ONBOARDING_KEY = '@kabiye_onboarding_complete'

interface OnboardingPage {
  id: string
  emoji: string
  titleKey: string
  descriptionKey: string
  accentColors: [string, string]
}

const OnboardingScreen = () => {
  const { t } = useLingui()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const pages: OnboardingPage[] = [
    {
      id: '1',
      // icon: <GlobeHemisphereEastIcon />,
      emoji: '🌍',
      titleKey: t`Discover Kabiyè`,
      descriptionKey: t`Explore a rich West African language spoken by millions. Learn words, phrases, and the beautiful Kabiyè alphabet.`,
      accentColors: ['#6200EE', '#7C3AED'],
    },
    {
      id: '2',
      emoji: '📖',
      titleKey: t`Your Personal Dictionary`,
      descriptionKey: t`Look up any Kabiyè word instantly. Browse by letter, search in French or English, and discover the Word of the Day.`,
      accentColors: ['#8B5CF6', '#BB86FC'],
    },
    {
      id: '3',
      emoji: '⌨️',
      titleKey: t`Type in Kabiyè`,
      descriptionKey: t`Use the built-in Kabiyè keyboard to type special characters. Copy text and share it anywhere.`,
      accentColors: ['#6200EE', '#8B5CF6'],
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

  const renderPage = ({ item, index }: { item: OnboardingPage; index: number }) => {
    const isActive = currentIndex === index

    return (
      <View style={{ width: SCREEN_WIDTH }} className="flex-1">
        {/* Emoji — entrance pop-in + continuous float */}
        <View className="mt-16 flex-1 items-center justify-center">
          <EaseView
            animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
            initialAnimate={{ scale: 0.7, opacity: 0 }}
            transition={isActive ? { type: 'spring', damping: 10, stiffness: 110 } : { type: 'none' }}
            useHardwareLayer
          >
            {/* Float loop — runs always, invisible when parent is hidden */}
            <EaseView
              animate={{ translateY: -10 }}
              initialAnimate={{ translateY: 0 }}
              transition={{ type: 'timing', duration: 2200, easing: 'easeInOut', loop: 'reverse' }}
            >
              <View className="bg-primary/10 rounded-[28px] p-10">
                <Text variant="h1" weight="bold" className="text-foreground text-center leading-loose">
                  {item.emoji}
                </Text>
              </View>
            </EaseView>
          </EaseView>
        </View>

        {/* Title + description — staggered slide-up entrance */}
        <View className="items-center px-8 pb-16">
          <EaseView
            animate={isActive ? { translateY: 0, opacity: 1 } : { translateY: 24, opacity: 0 }}
            initialAnimate={{ translateY: 24, opacity: 0 }}
            transition={
              isActive
                ? {
                    opacity: { type: 'timing', duration: 300, delay: 180, easing: 'easeOut' },
                    transform: { type: 'spring', damping: 14, stiffness: 140, delay: 180 },
                  }
                : { type: 'none' }
            }
          >
            <Text variant="h3" weight="bold" className="text-foreground mb-3 text-center">
              {item.titleKey}
            </Text>
          </EaseView>
          <EaseView
            animate={isActive ? { translateY: 0, opacity: 1 } : { translateY: 24, opacity: 0 }}
            initialAnimate={{ translateY: 24, opacity: 0 }}
            transition={
              isActive
                ? {
                    opacity: { type: 'timing', duration: 300, delay: 300, easing: 'easeOut' },
                    transform: { type: 'spring', damping: 14, stiffness: 140, delay: 300 },
                  }
                : { type: 'none' }
            }
          >
            <Text variant="body" className="text-foreground-secondary text-center leading-6">
              {item.descriptionKey}
            </Text>
          </EaseView>
        </View>
      </View>
    )
  }

  return (
    <View flex safeArea="all" className="bg-background">
      {/* Skip */}
      {currentIndex < pages.length - 1 && (
        <Pressable onPress={completeOnboarding} className="absolute top-12 right-8 mt-3 py-3" style={{ minHeight: 44 }}>
          <Text variant="body" className="text-foreground-secondary">
            {t`Skip`}
          </Text>
        </Pressable>
      )}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        extraData={currentIndex}
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
        <Pressable onPress={goToNext} className="bg-primary w-full items-center rounded-full py-4">
          <Text variant="body" weight="semibold" className="text-primary-foreground">
            {currentIndex === pages.length - 1 ? t`Get Started` : t`Next`}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export default OnboardingScreen
