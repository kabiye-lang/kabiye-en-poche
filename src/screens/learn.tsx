import { useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Link } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, CheckCircleIcon, LockIcon } from '@/components/icons'
import { ScreenTitle, Text, View } from '@/components/ui'
import { useAppLessonsWithProgress, useAppUnits } from '@/hooks/use-app-data'
import { useLanguage } from '@/hooks/use-language'
import { getDifficultyColor, getDifficultyLabel } from '@/utils/difficulty'

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
      <View flex safeArea="top" className="bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="text-foreground mt-4">{t`Loading learning units...`}</Text>
        </View>
      </View>
    )
  }

  if (unitsError) {
    return (
      <View flex safeArea="top" className="bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-primary text-center">
            {t`Failed to load learning units`}
          </Text>
          <Text variant="caption" className="text-foreground-secondary mt-2 text-center">
            {unitsError.message}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View flex className="bg-background">
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
  const { getValue } = useLanguage()
  const { data: lessons, isLoading: lessonsLoading } = useAppLessonsWithProgress(unit.id)

  const unitTitle = getValue(unit, 'title')
  const unitDescription = getValue(unit, 'description')

  const completedLessons = lessons?.filter((lesson) => lesson.is_completed).length || 0
  const totalLessons = lessons?.length || 0
  const isAvailable = unit.status === 'available'
  const isComingSoon = unit.status === 'coming_soon'
  const isMaintenance = unit.status === 'maintenance'
  const isDisabled = unit.status === 'disabled'

  if (!isAvailable) {
    return (
      <View
        className="border-border mb-4 overflow-hidden rounded-2xl border border-dashed"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={`${unitTitle}, ${isComingSoon ? t`Coming Soon` : isMaintenance ? t`Under Maintenance` : t`Temporarily Unavailable`}`}
      >
        <View className="bg-card/60 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="mb-1 flex-row items-center">
                <LockIcon size={16} className="text-foreground-secondary mr-2" />
                <Text variant="h6" weight="bold" className="text-foreground-secondary">
                  {unitTitle}
                </Text>
              </View>
              {unitDescription && (
                <Text variant="caption" className="text-foreground-secondary mb-2">
                  {unitDescription}
                </Text>
              )}
              <View className="bg-secondary/15 mt-1 self-start rounded-full px-3 py-1">
                <Text variant="caption" weight="semibold" className="text-secondary-text">
                  {isComingSoon && t`Coming Soon`}
                  {isMaintenance && t`Under Maintenance`}
                  {isDisabled && t`Temporarily Unavailable`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="bg-card mb-4 overflow-hidden rounded-2xl">
      <TouchableOpacity onPress={onToggle} className="p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text variant="h6" weight="bold" className="text-primary mb-1">
              {unitTitle}
            </Text>
            {unitDescription && (
              <Text variant="caption" className="text-foreground-secondary mb-2">
                {unitDescription}
              </Text>
            )}
            <View className="flex-row items-center">
              <Text variant="caption" className="text-foreground-secondary">
                {completedLessons}/{totalLessons} {t`lessons completed`}
              </Text>
              <View className="bg-progress-track ml-2 h-1.5 w-16 rounded-full">
                <View
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: totalLessons > 0 ? `${(completedLessons / totalLessons) * 100}%` : '0%' }}
                />
              </View>
            </View>
          </View>
          <CaretRightIcon
            size={20}
            className="text-primary"
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="border-border mx-4 mb-4 border-t pt-4">
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
              {lessons.map((lesson, index) => (
                <LessonItem key={lesson.id} lesson={lesson} index={index} />
              ))}
            </View>
          ) : (
            <Text variant="body" className="text-foreground-secondary py-4 text-center">
              {t`No lessons available yet`}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

interface LessonItemProps {
  lesson: {
    id: string
    title_en: string
    title_fr: string
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
    is_completed: boolean
    is_locked: boolean
  }
  index?: number
}

const LessonItem = ({ lesson, index = 0 }: LessonItemProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()

  const lessonTitle = getValue(lesson, 'title')
  const difficultyLabel = getDifficultyLabel(lesson.difficulty)
  const difficultyColor = getDifficultyColor(lesson.difficulty)
  const isAvailable = lesson.status === 'available' || lesson.status === null
  const isComingSoon = lesson.status === 'coming_soon'
  const isMaintenance = lesson.status === 'maintenance'
  const isDisabled = lesson.status === 'disabled'

  if (!isAvailable) {
    return (
      <Animated.View entering={FadeInDown.duration(200).delay(index * 60)}>
        <View
          className="border-border flex-row items-center rounded-lg border border-dashed p-3"
          accessibilityState={{ disabled: true }}
          accessibilityLabel={`${lessonTitle}, ${isComingSoon ? t`Coming Soon` : isMaintenance ? t`Under Maintenance` : t`Temporarily Unavailable`}`}
        >
          <LockIcon size={16} className="text-foreground-secondary" />
          <View className="ml-3 flex-1">
            <Text variant="body" className="text-foreground-secondary mb-1">
              {lessonTitle}
            </Text>
            <View className="bg-secondary/15 self-start rounded-full px-2 py-0.5">
              <Text variant="caption" weight="medium" className="text-secondary-text">
                {isComingSoon && t`Coming Soon`}
                {isMaintenance && t`Under Maintenance`}
                {isDisabled && t`Temporarily Unavailable`}
              </Text>
            </View>
          </View>
          <View className="rounded px-2 py-1" style={{ backgroundColor: difficultyColor + '20' }}>
            <Text variant="caption" style={{ color: difficultyColor }}>
              {difficultyLabel}
            </Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  if (lesson.is_locked) {
    return (
      <Animated.View entering={FadeInDown.duration(200).delay(index * 60)}>
        <View
          className="bg-background-tertiary flex-row items-center rounded-lg p-3 opacity-50"
          accessibilityState={{ disabled: true }}
          accessibilityLabel={`${lessonTitle}, ${t`Locked`}`}
        >
          <LockIcon size={20} className="text-foreground-secondary" />
          <View className="ml-3 flex-1">
            <Text variant="body" className="text-foreground-secondary mb-1">
              {lessonTitle}
            </Text>
            <Text variant="caption" className="text-foreground-secondary">
              {t`Complete previous lesson to unlock`}
            </Text>
          </View>
          <View className="rounded px-2 py-1" style={{ backgroundColor: difficultyColor + '20' }}>
            <Text variant="caption" style={{ color: difficultyColor }}>
              {difficultyLabel}
            </Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  return (
    <Animated.View entering={FadeInDown.duration(200).delay(index * 60)}>
      <Link href={`/lesson/${lesson.id}`} asChild>
        <TouchableOpacity>
          <View className="bg-card flex-row items-center rounded-lg p-3">
            {lesson.is_completed ? (
              <CheckCircleIcon size={20} className="text-success" />
            ) : (
              <View className="border-primary h-5 w-5 rounded-full border-2" />
            )}
            <View className="ml-3 flex-1">
              <Text variant="body" weight={lesson.is_completed ? 'medium' : 'regular'} className="text-foreground mb-1">
                {lessonTitle}
              </Text>
              <Text variant="caption" className="text-foreground-secondary">
                {lesson.is_completed ? t`Completed` : t`Tap to start`}
              </Text>
            </View>
            <View className="rounded px-2 py-1" style={{ backgroundColor: difficultyColor + '20' }}>
              <Text variant="caption" style={{ color: difficultyColor }}>
                {difficultyLabel}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    </Animated.View>
  )
}

export default LearnScreen
