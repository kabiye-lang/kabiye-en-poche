import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, PlayIcon, SparkleIcon } from '@/components/icons'
import { Gradient, Text, View } from '@/components/ui'
import { WordOfTheDay } from '@/components/word-of-the-day'
import { useAppNextLesson } from '@/hooks/use-app-data'
import { useWordOfTheDay } from '@/hooks/use-dictionary'
import { useLanguage } from '@/hooks/use-language'

const HomeScreen = () => {
  const { t } = useLingui()
  const { getValue, currentLanguage } = useLanguage()
  const { data: nextLesson, isLoading: nextLessonLoading } = useAppNextLesson()
  const { data: wordOfTheDay, isLoading: isLoadingWotD } = useWordOfTheDay(1)

  const hasNextLesson = !nextLessonLoading && !!nextLesson

  return (
    <View flex safeArea="top" className="bg-background">
      <ScrollView className="px-4 pb-5">
        <View flex>
          {/* Hero Section */}
          {hasNextLesson ? (
            /* Returning user — compact continue learning hero */
            <View className="mb-5 overflow-hidden rounded-2xl">
              <Gradient colors={['#1B6B3C', '#2A8B55']}>
                <Link href={`/lesson/${nextLesson.id}`} asChild>
                  <TouchableOpacity className="p-5">
                    <Text variant="caption" weight="medium" className="mb-1 text-white/80">
                      {t`Continue Learning`}
                    </Text>
                    <Text variant="h4" weight="bold" className="mb-2 text-white">
                      {getValue(nextLesson, 'title')}
                    </Text>
                    <View className="flex-row items-center">
                      <PlayIcon size={18} className="mr-2 text-white" />
                      <Text variant="body" weight="medium" className="text-white/90">
                        {t`Resume lesson`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              </Gradient>
            </View>
          ) : nextLessonLoading ? (
            /* Loading state */
            <View className="mb-5 overflow-hidden rounded-2xl">
              <Gradient colors={['#1B6B3C', '#C8922A']}>
                <View className="items-center justify-center p-8">
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              </Gradient>
            </View>
          ) : (
            /* New user — large cultural hero */
            <View className="mb-5 overflow-hidden rounded-2xl">
              <Gradient colors={['#1B6B3C', '#C8922A']}>
                <View className="p-6">
                  <Text variant="h2" weight="bold" className="mb-2 text-white">
                    {t`Ɛsɔɔlaa!`}
                  </Text>
                  <Text variant="h6" weight="medium" className="text-white/90">
                    {t`Welcome — Discover the beauty of the Kabiyè language`}
                  </Text>
                  <Link href="/learn" asChild>
                    <TouchableOpacity className="mt-4 self-start rounded-full bg-white/20 px-5 py-2.5">
                      <Text variant="body" weight="semibold" className="text-white">
                        {t`Start Learning`}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </Gradient>
            </View>
          )}

          {/* Alphabet Section */}
          <Link href="/alphabet" asChild>
            <TouchableOpacity className="bg-card mb-5 flex-row items-center justify-between rounded-2xl p-4">
              <View className="flex-1">
                <Text variant="h6" weight="bold" className="text-primary">
                  {t`Kabiyè Alphabet`}
                </Text>
                <Text variant="caption" className="text-foreground-secondary mt-1">
                  {t`Learn the letters and sounds`}
                </Text>
              </View>
              <CaretRightIcon size={20} weight="regular" className="text-primary" />
            </TouchableOpacity>
          </Link>

          {/* Word of the Day */}
          <View className="mb-5">
            <View className="mb-2.5 flex-row items-center">
              <SparkleIcon size={20} weight="duotone" className="text-secondary mr-1.5" />
              <Text variant="h5" weight="semibold" className="text-foreground">
                {t`Word of the Day`}
              </Text>
            </View>
            <WordOfTheDay words={wordOfTheDay ?? []} language={currentLanguage} isLoading={isLoadingWotD} />
          </View>

          {/* Quick Links */}
          <View className="mb-5 flex-row gap-3">
            <Link href="/learn" asChild>
              <TouchableOpacity className="bg-card flex-1 items-center rounded-2xl p-4">
                <Text variant="body" weight="semibold" className="text-primary">
                  {t`Lessons`}
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href="/dictionary" asChild>
              <TouchableOpacity className="bg-card flex-1 items-center rounded-2xl p-4">
                <Text variant="body" weight="semibold" className="text-primary">
                  {t`Dictionary`}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default HomeScreen
