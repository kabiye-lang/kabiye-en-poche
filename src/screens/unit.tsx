import React from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Link, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CheckCircleIcon, LockIcon } from '@/components/icons'
import { Card, Gradient, Text, View } from '@/components/ui'
import { useAppLessonsWithProgress, useAppUnit } from '@/hooks/use-app-data'
import { brandColors } from '@/utils/design-system-nativewind'

const UnitScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const unitId = id as string
  const safeAreaInsets = useSafeAreaInsets()

  const { data: unit, isLoading: unitLoading, error: unitError } = useAppUnit(unitId)
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError } = useAppLessonsWithProgress(unitId)

  if (unitLoading) {
    return (
      <View flex safeArea="top" className="bg-grey dark:bg-gray-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">Loading unit...</Text>
        </View>
      </View>
    )
  }

  if (unitError || !unit) {
    return (
      <View flex safeArea="top" className="bg-grey dark:bg-gray-900">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-center text-primary">
            Unit not found
          </Text>
          <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
            {unitError?.message || 'This unit does not exist'}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View flex className="bg-white dark:bg-gray-900">
      <ScrollView className="px-4 py-5" style={{ paddingTop: 40 + safeAreaInsets.top }}>
        {/* Unit Header */}
        <Gradient colors={[brandColors.primary, brandColors.secondary]} className="my-5">
          <View className="flex-col items-start justify-center p-5">
            <Text variant="h1" weight="bold" className="mb-2.5 text-white">
              {unit.title_en}
            </Text>
            {unit.description_en && (
              <Text variant="h5" weight="medium" className="mt-2.5 text-white">
                {unit.description_en}
              </Text>
            )}
          </View>
        </Gradient>

        {/* Lessons Section */}
        <View className="mb-5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            {t`Lessons`}
          </Text>
          {lessonsLoading ? (
            <Card className="p-4">
              <View className="flex-row items-center">
                <ActivityIndicator size="small" className="text-primary" />
                <Text className="ml-2">{t`Loading lessons...`}</Text>
              </View>
            </Card>
          ) : lessonsError ? (
            <Card className="p-4">
              <View className="items-center">
                <Text variant="h6" className="text-center text-primary">
                  {t`Lessons temporarily unavailable`}
                </Text>
                <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
                  {t`Please check your connection and try again`}
                </Text>
              </View>
            </Card>
          ) : lessons && lessons.length > 0 ? (
            <View className="space-y-2.5">
              {lessons.map((lesson) => (
                <LessonItem key={lesson.id} lesson={lesson} />
              ))}
            </View>
          ) : (
            <Card className="p-4">
              <View className="items-center">
                <Text variant="h6" className="text-center text-primary">
                  {t`No lessons available`}
                </Text>
                <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
                  {t`Lessons will be added soon`}
                </Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

interface LessonItemProps {
  lesson: {
    id: string
    title_en: string
    title_fr: string
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    is_completed: boolean
    is_locked: boolean
  }
}

const LessonItem = ({ lesson }: LessonItemProps) => {
  const { t } = useLingui()

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return '#4CAF50'
      case 'Intermediate':
        return '#FF9800'
      case 'Advanced':
        return '#F44336'
      default:
        return brandColors.primary
    }
  }

  if (lesson.is_locked) {
    return (
      <View className="bg-grey flex-row items-center rounded-lg p-3 opacity-50">
        <LockIcon size={20} className="text-text-grey dark:text-gray-400" />
        <View className="ml-3 flex-1">
          <Text variant="body" className="mb-1 text-text-grey dark:text-gray-400">
            {lesson.title_en}
          </Text>
          <Text variant="caption" className="text-text-grey dark:text-gray-400">
            {t`Complete previous lesson to unlock`}
          </Text>
        </View>
        <View className="rounded px-2 py-1" style={{ backgroundColor: getDifficultyColor(lesson.difficulty) + '20' }}>
          <Text variant="caption" style={{ color: getDifficultyColor(lesson.difficulty) }}>
            {lesson.difficulty}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <Link href={`/lesson/${lesson.id}`} asChild>
      <TouchableOpacity>
        <View className="flex-row items-center rounded-lg bg-white p-3">
          {lesson.is_completed ? (
            <CheckCircleIcon size={20} className="text-success" />
          ) : (
            <View className="h-5 w-5 rounded-full border-2 border-primary" />
          )}
          <View className="ml-3 flex-1">
            <Text
              variant="body"
              weight={lesson.is_completed ? 'medium' : 'regular'}
              className="mb-1 text-text-dark dark:text-gray-100"
            >
              {lesson.title_en}
            </Text>
            <Text variant="caption" className="text-text-grey dark:text-gray-400">
              {lesson.is_completed ? t`Completed` : t`Tap to start`}
            </Text>
          </View>
          <View className="rounded px-2 py-1" style={{ backgroundColor: getDifficultyColor(lesson.difficulty) + '20' }}>
            <Text variant="caption" style={{ color: getDifficultyColor(lesson.difficulty) }}>
              {lesson.difficulty}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  )
}

export default UnitScreen
