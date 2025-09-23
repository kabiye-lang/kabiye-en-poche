import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, PlayIcon } from '@/components/icons'
import { Card, Gradient, Text, View } from '@/components/ui'
import { useAppNextLesson, useAppUnits } from '@/hooks/use-app-data'
import { brandColors } from '@/utils/design-system-nativewind'

const HomeScreen = () => {
  const { t } = useLingui()
  const { data: units, isLoading: unitsLoading, error: unitsError } = useAppUnits()
  const { data: nextLesson, isLoading: nextLessonLoading } = useAppNextLesson()

  const renderContinueLessonSection = () => {
    if (nextLessonLoading) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5 text-text-dark dark:text-gray-100">
            {t`Continue Learning`}
          </Text>
          <Card className="h-[120px] px-4 py-2.5">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="small" className="text-primary" />
              <Text variant="caption" className="mt-2 text-text-grey dark:text-gray-400">
                {t`Loading...`}
              </Text>
            </View>
          </Card>
        </View>
      )
    }

    if (!nextLesson) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5 text-text-dark dark:text-gray-100">
            {t`Continue Learning`}
          </Text>
          <Card className="h-[120px] px-4 py-2.5">
            <View className="flex-1 items-center justify-center">
              <Text variant="h6" className="text-center text-primary dark:text-gray-100">
                {t`All lessons completed! 🎉`}
              </Text>
              <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
                {t`Great job on finishing the course`}
              </Text>
            </View>
          </Card>
        </View>
      )
    }

    return (
      <View className="mb-5">
        <Text variant="h5" weight="semibold" className="mb-2.5 text-text-dark dark:text-gray-100">
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
                  <Text variant="caption" className="mb-1 text-text-grey dark:text-gray-400">
                    {nextLesson.difficulty}
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

  const renderUnitsSection = () => {
    if (unitsLoading) {
      return (
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5 text-text-dark dark:text-gray-100">
            {t`Learning Units`}
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {[1, 2, 3].map((i) => (
              <View className="mb-2.5 w-[48%]" key={i}>
                <Card className="h-[170px] px-4 py-2.5">
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="small" className="text-primary" />
                    <Text variant="caption" className="mt-2 text-text-grey dark:text-gray-400">
                      {t`Loading...`}
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
          <Text variant="h5" weight="semibold" className="mb-2.5 text-text-dark dark:text-gray-100">
            {t`Learning Units`}
          </Text>
          <Card className="h-[170px] px-4 py-2.5">
            <View className="flex-1 items-center justify-center">
              <Text variant="h6" className="text-center text-primary dark:text-gray-100">
                {t`Units temporarily unavailable`}
              </Text>
              <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
                {t`Please check your connection and try again`}
              </Text>
            </View>
          </Card>
        </View>
      )
    }

    return (
      <View className="mb-5">
        <Text variant="h5" weight="semibold" className="mb-2.5 text-text-dark dark:text-gray-100">
          {t`Let's Learn Together!`}
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {units?.slice(0, 3).map((unit) => {
            const isAvailable = unit.status === 'available'
            const isComingSoon = unit.status === 'coming_soon'
            const isMaintenance = unit.status === 'maintenance'
            const isDisabled = unit.status === 'disabled'

            return (
              <View className="mb-2.5 w-[48%]" key={unit.id}>
                <Card className={`h-[170px] px-4 py-2.5 ${!isAvailable ? 'opacity-50' : ''}`}>
                  {isAvailable ? (
                    <Link href={`/unit/${unit.id}`} asChild>
                      <TouchableOpacity className="flex-1">
                        <View className="flex-1">
                          <Text variant="h6" weight="bold" className="mt-2.5 text-primary dark:text-gray-100">
                            {unit.title_en}
                          </Text>
                          <Text variant="caption" className="mt-2.5 text-text-grey dark:text-gray-400">
                            {unit.description_en}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </Link>
                  ) : (
                    <TouchableOpacity className="flex-1" disabled>
                      <View className="flex-1">
                        <Text variant="h6" weight="bold" className="mt-2.5 text-text-grey dark:text-gray-400">
                          {unit.title_en}
                        </Text>
                        <Text variant="caption" className="mt-2.5 text-text-grey dark:text-gray-400">
                          {unit.description_en}
                        </Text>
                        <View className="mt-2">
                          <Text variant="caption" className="text-text-grey dark:text-gray-400">
                            {isComingSoon && t`Coming Soon`}
                            {isMaintenance && t`Under Maintenance`}
                            {isDisabled && t`Temporarily Unavailable`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                </Card>
              </View>
            )
          })}
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
                <Text variant="h2" weight="bold" className="mb-2.5 text-white">
                  {t`Welcome to Kabiyè en Poche`}
                </Text>
                <Text variant="h5" weight="medium" className="mt-2.5 text-white">
                  {t`Learn Kabiyè in a fun and interactive way`}
                </Text>
              </View>
            </Gradient>
          </Card>

          {/* Continue Lesson Section */}
          {renderContinueLessonSection()}

          {/* Kabiyè Alphabet Section */}
          <View className="mb-5">
            <Text variant="h5" weight="semibold" className="mb-2.5 text-text-dark dark:text-gray-100">
              {t`Learn the Basics`}
            </Text>
            <Card className="mb-2.5 flex-row items-center p-5">
              <Link href="/alphabet" className="w-full flex-row items-center justify-between" asChild>
                <TouchableOpacity className="w-full flex-row items-center">
                  <View className="flex-1">
                    <Text variant="h6" weight="bold" className="mt-2.5 text-primary dark:text-gray-100">
                      {t`Kabiyè Alphabet`}
                    </Text>
                    <Text variant="caption" className="mt-2.5 text-text-grey dark:text-gray-400">
                      {t`Learn the Kabiyè alphabet`}
                    </Text>
                  </View>
                  <CaretRightIcon size={24} className="text-primary dark:text-gray-100" />
                </TouchableOpacity>
              </Link>
            </Card>
          </View>

          {/* Units Section */}
          {renderUnitsSection()}
        </View>
      </ScrollView>
    </View>
  )
}

export default HomeScreen
