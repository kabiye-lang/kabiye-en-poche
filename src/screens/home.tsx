import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, PlayIcon } from '@/components/icons'
import { Card, Gradient, Text, View } from '@/components/ui'
import { useAppNextLesson, useAppProgressSummary, useAppUnits } from '@/hooks/use-app-data'
import { brandColors } from '@/utils/design-system-nativewind'

const HomeScreen = () => {
  const { t } = useLingui()
  const { data: units, isLoading: unitsLoading, error: unitsError } = useAppUnits()
  const { data: nextLesson, isLoading: nextLessonLoading } = useAppNextLesson()
  const { data: progressSummary, isLoading: progressLoading } = useAppProgressSummary()

  const renderContinueLessonSection = () => {
    if (nextLessonLoading) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            {t`Continue Learning`}
          </Text>
          <Card className="h-[120px] px-4 py-2.5">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color={brandColors.primary} />
              <Text variant="caption" color="grey" className="mt-2">
                Loading...
              </Text>
            </View>
          </Card>
        </View>
      )
    }

    if (!nextLesson) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            {t`Continue Learning`}
          </Text>
          <Card className="h-[120px] px-4 py-2.5">
            <View className="flex-1 items-center justify-center">
              <Text variant="h6" color="primary" className="text-center">
                {t`All lessons completed! 🎉`}
              </Text>
              <Text variant="caption" color="grey" className="mt-2 text-center">
                {t`Great job on finishing the course`}
              </Text>
            </View>
          </Card>
        </View>
      )
    }

    return (
      <View className="mb-5">
        <Text variant="h5" weight="semibold" className="mb-2.5">
          {t`Continue Learning`}
        </Text>
        <Card className="h-[120px] px-4 py-2.5">
          <Link href={`/lesson/${nextLesson.id}`} asChild>
            <TouchableOpacity className="flex-1">
              <View className="flex-1 flex-row items-center">
                <View className="flex-1">
                  <Text variant="h6" weight="bold" className="mb-1 text-primary dark:text-gray-100">
                    {nextLesson.title_en}
                  </Text>
                  <Text variant="caption" color="grey" className="mb-1">
                    {nextLesson.units?.title_en} • {nextLesson.difficulty}
                  </Text>
                  <Text variant="caption" className="text-primary dark:text-gray-100">
                    {t`Tap to continue`}
                  </Text>
                </View>
                <View className="ml-2.5">
                  <PlayIcon size={24} className="text-primary dark:text-gray-100" />
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        </Card>
      </View>
    )
  }

  const renderProgressSection = () => {
    if (progressLoading) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            {t`Your Progress`}
          </Text>
          <Card className="h-[100px] px-4 py-2.5">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" color={brandColors.primary} />
              <Text variant="caption" color="grey" className="mt-2">
                Loading progress...
              </Text>
            </View>
          </Card>
        </View>
      )
    }

    if (!progressSummary) {
      return null
    }

    return (
      <View className="mb-5">
        <Text variant="h5" weight="semibold" className="mb-2.5">
          {t`Your Progress`}
        </Text>
        <Card className="px-4 py-2.5">
          <View className="mb-2 flex-row items-center justify-between">
            <Text variant="body" color="grey">
              {t`Units completed`}
            </Text>
            <Text variant="body" weight="semibold" color="primary">
              {progressSummary.completedUnits} / {progressSummary.totalUnits}
            </Text>
          </View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="body" color="grey">
              {t`Lessons completed`}
            </Text>
            <Text variant="body" weight="semibold" color="primary">
              {progressSummary.completedLessons} / {progressSummary.totalLessons}
            </Text>
          </View>
          <View className="bg-grey h-2 w-full rounded-full dark:bg-gray-600">
            <View
              className="h-2 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressSummary.progressPercentage}%` }}
            />
          </View>
        </Card>
      </View>
    )
  }

  const renderUnitsSection = () => {
    if (unitsLoading) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            {t`Learning Units`}
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3].map((i) => (
              <View className="mb-2.5 w-[48%]" key={i}>
                <Card className="h-[170px] px-4 py-2.5">
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="small" color={brandColors.primary} />
                    <Text variant="caption" color="grey" className="mt-2">
                      Loading...
                    </Text>
                  </View>
                </Card>
              </View>
            ))}
          </View>
        </View>
      )
    }

    if (unitsError) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            {t`Learning Units`}
          </Text>
          <Card className="h-[170px] px-4 py-2.5">
            <View className="flex-1 items-center justify-center">
              <Text variant="h6" className="text-center text-primary dark:text-gray-100">
                {t`Units temporarily unavailable`}
              </Text>
              <Text variant="caption" className="text-grey mt-2 text-center dark:text-gray-400">
                {t`Please check your connection and try again`}
              </Text>
            </View>
          </Card>
        </View>
      )
    }

    return (
      <View className="mb-5">
        <Text variant="h5" weight="semibold" className="mb-2.5">
          {t`Learning Units`}
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {units?.slice(0, 3).map((unit) => (
            <View className="mb-2.5 w-[48%]" key={unit.id}>
              <Card className="h-[170px] px-4 py-2.5">
                <Link href={`/unit/${unit.id}`} asChild>
                  <TouchableOpacity className="flex-1">
                    <View className="flex-1">
                      <Text variant="h6" weight="bold" className="mt-2.5 text-primary dark:text-gray-100">
                        {unit.title_en}
                      </Text>
                      <Text variant="caption" className="text-grey mt-2.5 dark:text-gray-400">
                        {unit.description_en}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              </Card>
            </View>
          ))}
          <View className="mb-2.5 w-[48%]">
            <Card className="h-[170px] !bg-accent p-5">
              <Link href="/learn" asChild>
                <TouchableOpacity className="flex-1">
                  <View className="h-full flex-row items-center justify-center">
                    <Text variant="h6" weight="bold" className="text-white dark:text-gray-100">
                      {t`View All`}
                    </Text>
                    <View className="ml-2.5">
                      <CaretRightIcon size={24} className="text-white dark:text-gray-100" />
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            </Card>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View flex safeArea="top" className="bg-grey dark:bg-gray-900">
      <ScrollView className="px-4 pb-5">
        <View flex>
          {/* Redesigned Top Card */}
          <Card padding="none" className="mb-5">
            <Gradient colors={[brandColors.primary, brandColors.secondary]}>
              <View className="flex-col items-start justify-center p-5">
                <Text variant="h2" weight="bold" color="white" className="mb-2.5">
                  {t`Welcome to Kabiyè en Poche`}
                </Text>
                <Text variant="h5" weight="medium" color="white" className="mt-2.5">
                  {t`Learn Kabiyè in a fun and interactive way`}
                </Text>
              </View>
            </Gradient>
          </Card>

          {/* Continue Lesson Section */}
          {renderContinueLessonSection()}

          {/* Progress Summary Section */}
          {renderProgressSection()}

          {/* Units Section */}
          {renderUnitsSection()}

          <View className="mb-5">
            <Text variant="h5" weight="semibold" className="mb-2.5">
              {t`Resources`}
            </Text>

            <Card className="mb-2.5 flex-row items-center p-5">
              <Link href="/alphabet" className="w-full flex-row items-center justify-between" asChild>
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="h6" weight="bold" className="mt-2.5 text-primary dark:text-gray-100">
                      {t`Kabiyè Alphabet`}
                    </Text>
                    <Text variant="caption" className="text-grey mt-2.5 dark:text-gray-400">
                      {t`Learn the Kabiyè alphabet`}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} className="text-primary dark:text-gray-100" />
                </TouchableOpacity>
              </Link>
            </Card>
            <Card className="mb-2.5 flex-row items-center p-5">
              <Link href="/profile" className="w-full flex-row items-center justify-between">
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="h6" weight="bold" className="mt-2.5 text-primary dark:text-gray-100">
                      {t`Learning Resources`}
                    </Text>
                    <Text variant="caption" className="text-grey mt-2.5 dark:text-gray-400">
                      {t`Access learning materials and resources`}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} className="text-primary dark:text-gray-100" />
                </TouchableOpacity>
              </Link>
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default HomeScreen
