import { useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, CheckCircleIcon, LockIcon } from '@/components/icons'
import { Card, ScreenTitle, Text, View } from '@/components/ui'
import { useAppLessonsWithProgress, useAppUnits } from '@/hooks/use-app-data'
import { brandColors } from '@/utils/design-system-nativewind'

const LearnScreen = () => {
  const { t } = useLingui()
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set())

  const { data: units, isLoading: unitsLoading, error: unitsError } = useAppUnits()

  const toggleUnit = (unitId: string) => {
    const newExpanded = new Set(expandedUnits)
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId)
    } else {
      newExpanded.add(unitId)
    }
    setExpandedUnits(newExpanded)
  }

  if (unitsLoading) {
    return (
      <View flex safeArea="top" className="bg-grey dark:bg-gray-900">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">{t`Loading learning units...`}</Text>
        </View>
      </View>
    )
  }

  if (unitsError) {
    return (
      <View flex safeArea="top" className="bg-grey dark:bg-gray-900">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-center text-primary">
            {t`Failed to load learning units`}
          </Text>
          <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
            {unitsError.message}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View flex className="bg-grey dark:bg-gray-900">
      <ScrollView className="px-4 pb-5">
        <ScreenTitle title={t`Learn Kabiyè`} />
        {units?.map((unit) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            isExpanded={expandedUnits.has(unit.id)}
            onToggle={() => toggleUnit(unit.id)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

interface UnitCardProps {
  unit: {
    id: string
    title_en: string
    title_fr: string
    description_en: string | null
    description_fr: string | null
    status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
  }
  isExpanded: boolean
  onToggle: () => void
}

const UnitCard = ({ unit, isExpanded, onToggle }: UnitCardProps) => {
  const { t } = useLingui()
  const { data: lessons, isLoading: lessonsLoading } = useAppLessonsWithProgress(unit.id)

  const completedLessons = lessons?.filter((lesson) => lesson.is_completed).length || 0
  const totalLessons = lessons?.length || 0
  const isAvailable = unit.status === 'available'
  const isComingSoon = unit.status === 'coming_soon'
  const isMaintenance = unit.status === 'maintenance'
  const isDisabled = unit.status === 'disabled'

  return (
    <Card className={`mb-4 p-4 ${!isAvailable ? 'opacity-50' : ''}`}>
      <TouchableOpacity onPress={isAvailable ? onToggle : undefined} disabled={!isAvailable}>
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              variant="h6"
              weight="bold"
              className={`mb-1 ${isAvailable ? 'text-primary dark:text-gray-100' : 'text-text-grey dark:text-gray-400'}`}
            >
              {unit.title_en}
            </Text>
            {unit.description_en && (
              <Text variant="caption" className="mb-2 text-text-grey dark:text-gray-400">
                {unit.description_en}
              </Text>
            )}
            {isAvailable ? (
              <View className="flex-row items-center">
                <Text variant="caption" className="text-text-grey dark:text-gray-400">
                  {completedLessons}/{totalLessons} {t`lessons completed`}
                </Text>
                <View className="bg-grey ml-2 h-1.5 w-16 rounded-full dark:bg-gray-600">
                  <View
                    className="h-1.5 rounded-full bg-primary transition-all duration-300"
                    style={{ width: totalLessons > 0 ? `${(completedLessons / totalLessons) * 100}%` : '0%' }}
                  />
                </View>
              </View>
            ) : (
              <View className="mt-1">
                <Text variant="caption" className="text-text-grey dark:text-gray-400">
                  {isComingSoon && t`Coming Soon`}
                  {isMaintenance && t`Under Maintenance`}
                  {isDisabled && t`Temporarily Unavailable`}
                </Text>
              </View>
            )}
          </View>
          <CaretRightIcon
            size={20}
            className={isAvailable ? 'text-primary dark:text-gray-100' : 'text-text-grey dark:text-gray-400'}
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="border-grey mt-4 border-t pt-4 dark:border-gray-600">
          {lessonsLoading ? (
            <View className="space-y-2">
              {[1, 2, 3].map((i) => (
                <View key={i} className="flex-row items-center p-2">
                  <ActivityIndicator size="small" className="text-primary" />
                  <Text className="ml-2">{t`Loading lessons...`}</Text>
                </View>
              ))}
            </View>
          ) : lessons && lessons.length > 0 ? (
            <View className="space-y-2">
              {lessons.map((lesson) => (
                <LessonItem key={lesson.id} lesson={lesson} />
              ))}
            </View>
          ) : (
            <Text variant="body" className="py-4 text-center text-text-grey dark:text-gray-400">
              {t`No lessons available yet`}
            </Text>
          )}
        </View>
      )}
    </Card>
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
      <View className="bg-grey flex-row items-center rounded-lg p-3 opacity-50 dark:bg-gray-700">
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
        <View className="flex-row items-center rounded-lg bg-white p-3 dark:bg-gray-800">
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

export default LearnScreen
