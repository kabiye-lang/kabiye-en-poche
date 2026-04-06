import { ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { ArticleIcon, BookOpenTextIcon, CaretRightIcon, PlayIcon, SparkleIcon } from '@/components/icons'
import { Text, View } from '@/components/ui'
import { WordOfTheDay } from '@/components/word-of-the-day'
import { useAppNextLesson } from '@/hooks/use-app-data'
import { useWordOfTheDay } from '@/hooks/use-dictionary'
import { useLanguage } from '@/hooks/use-language'

const HomeScreen = () => {
  const { t } = useLingui()
  const { getValue, currentLanguage } = useLanguage()
  const { data: nextLesson, isLoading: nextLessonLoading } = useAppNextLesson()
  const { data: wordOfTheDay, isLoading: isLoadingWotD, isError: isWotDError } = useWordOfTheDay(1)

  const hasNextLesson = !nextLessonLoading && !!nextLesson

  return (
    <View flex safeArea="top" className="bg-background">
      <ScrollView className="px-4 pb-5">
        <View flex>
          {/* Hero Section */}
          {hasNextLesson ? (
            /* Returning user — flat primary card, no gradient clipping issues */
            <View className="bg-primary mb-5 rounded-2xl p-5">
              <Text variant="caption" weight="medium" className="text-primary-foreground/70 mb-1">
                {t`Continue Learning`}
              </Text>
              <Text variant="h4" weight="bold" className="text-primary-foreground mb-3">
                {getValue(nextLesson, 'title')}
              </Text>
              <Link href={`/lesson/${nextLesson.id}`} asChild>
                <TouchableOpacity
                  className="bg-primary-foreground/20 flex-row items-center self-start rounded-full px-5 py-3"
                  style={{ minHeight: 44 }}
                  accessibilityRole="button"
                >
                  <PlayIcon size={18} className="text-primary-foreground mr-2" />
                  <Text variant="body" weight="semibold" className="text-primary-foreground">
                    {t`Resume lesson`}
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          ) : nextLessonLoading ? (
            /* Loading state — semantic skeleton surface, no gradient */
            <View className="bg-card mb-5 rounded-2xl p-5">
              <View className="bg-foreground/10 mb-2 h-4 w-24 rounded" />
              <View className="bg-foreground/10 h-6 w-3/4 rounded" />
            </View>
          ) : (
            /* New user — compact purposeful CTA, visible even if data is slow */
            <View className="bg-primary mb-5 rounded-2xl p-5">
              <Text variant="h5" weight="bold" className="text-primary-foreground mb-1">
                {t`Ɛsɔɔlaa!`}
              </Text>
              <Text variant="body" className="text-primary-foreground/85 mb-4">
                {t`Start your Kabiyè journey`}
              </Text>
              <Link href="/learn" asChild>
                <TouchableOpacity
                  className="bg-primary-foreground/20 self-start rounded-full px-5 py-3"
                  style={{ minHeight: 44 }}
                  accessibilityRole="button"
                >
                  <Text variant="body" weight="semibold" className="text-primary-foreground">
                    {t`Start Learning`}
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}

          {/* Word of the Day — promoted to hero position */}
          <View className="mb-5">
            <View className="mb-2.5 flex-row items-center">
              <SparkleIcon size={20} weight="duotone" className="text-secondary mr-1.5" />
              <Text variant="h5" weight="semibold" className="text-foreground">
                {t`Word of the Day`}
              </Text>
            </View>
            <WordOfTheDay
              words={wordOfTheDay ?? []}
              language={currentLanguage}
              isLoading={isLoadingWotD}
              isError={isWotDError}
            />
          </View>

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

          {/* Quick Links */}
          <View className="mb-5 flex-row gap-3">
            <Link href="/learn" asChild>
              <TouchableOpacity className="bg-primary/10 flex-1 items-center rounded-2xl py-6">
                <BookOpenTextIcon size={24} weight="duotone" className="text-primary mb-2" />
                <Text variant="body" weight="semibold" className="text-primary">
                  {t`Lessons`}
                </Text>
              </TouchableOpacity>
            </Link>
            <Link href="/dictionary" asChild>
              <TouchableOpacity className="bg-primary/10 flex-1 items-center rounded-2xl py-6">
                <ArticleIcon size={24} weight="duotone" className="text-primary mb-2" />
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
