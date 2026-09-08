import type { LearnerPath } from '../hooks/use-path'

import { Pressable, ScrollView } from 'react-native'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, CheckIcon, LockIcon, PlayIcon } from '../components/icons'
import { Skeleton, SkeletonRows, Text, View } from '../components/ui'
import { useAppLessonsWithProgress, useAppNextLesson, useAppUnits } from '../hooks/use-app-data'
import { useLanguage } from '../hooks/use-language'
import { orderUnitsForPath, usePath } from '../hooks/use-path'

/**
 * The whole path on one screen.
 *
 * Units used to be cards you tapped into, which put a navigation step between the
 * learner and the only thing they came for -- the next lesson -- and hid how far the
 * curriculum went. Laterite makes the units chapters of a single list: every lesson is
 * visible, the current one is an ink card you can start from here, and what is finished
 * is struck through rather than removed.
 */
const PATH_DESCRIPTION: Record<LearnerPath, string> = {
  speaker: 'Set for someone who already speaks Kabiyè.',
  heritage: 'Set for someone who grew up hearing Kabiyè.',
  new: 'Set for someone new to Kabiyè.',
}

const LearnScreen = () => {
  const { t } = useLingui()
  const { data: units, isLoading, error } = useAppUnits()
  const { data: nextLesson } = useAppNextLesson()
  const { path } = usePath()

  const ordered = orderUnitsForPath(units ?? [], path)

  if (isLoading) {
    return (
      <View className="bg-background flex-1 px-6 pt-16">
        <Skeleton className="h-11 w-3/5" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <SkeletonRows rows={5} />
      </View>
    )
  }

  if (error) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-center text-[17px]">{t`We could not load your path.`}</Text>
      </View>
    )
  }

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-6 pb-10 pt-16">
      <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Learn`}</Text>
      <Text weight="semibold" className="text-foreground mt-2 text-[40px] leading-[1.0]">
        {t`Your path`}
      </Text>

      <View className="mt-3 flex-row flex-wrap items-baseline gap-2">
        <Text className="text-foreground-secondary text-[15px]">{path ? PATH_DESCRIPTION[path] : t`Not set yet.`}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(onboarding)')}>
          <Text className="text-foreground text-[15px] underline">{t`Change`}</Text>
        </Pressable>
      </View>

      <View className="mt-8">
        {ordered.map((unit) => (
          <UnitChapter key={unit.id} unit={unit} currentLessonId={nextLesson?.id} />
        ))}
      </View>
    </ScrollView>
  )
}

interface UnitChapterProps {
  unit: {
    id: string
    code?: string | null
    title_en: string
    title_fr: string
    status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
  }
  /** The one lesson to resume, across the whole path. */
  currentLessonId?: string
}

const UnitChapter = ({ unit, currentLessonId }: UnitChapterProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  const { data: lessons } = useAppLessonsWithProgress(unit.id)

  const title = getValue(unit, 'title')
  const isOpen = unit.status === 'available' || unit.status === null
  const done = lessons?.filter((lesson) => lesson.is_completed).length ?? 0
  const total = lessons?.length ?? 0

  // The ink card marks where to resume, and there is exactly one of those on the screen.
  // Computing it per unit gave every unit its own -- three "continue here" cards on one
  // path, which is three answers to a question that has one. `useAppNextLesson` already
  // knows the globally next lesson, so the unit only asks whether it holds it.

  // No entering animation on this block. Each chapter fetches its own lessons, so it
  // mounts short and grows when they arrive; Reanimated snapshots the layout at mount
  // and the siblings never catch up -- two units drew on top of each other with a gap
  // above them. A stagger is not worth a path a learner cannot read.
  return (
    <View className="mb-9">
      <View className="border-foreground flex-row items-baseline border-b-[1.5px] pb-2">
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">
          {unit.code ? unit.code.replace(/^U0*/, t`Unit ` + '') : t`Unit`}
        </Text>
        <Text weight="semibold" className="text-foreground ml-3 flex-1 text-[22px] leading-[1.15]">
          {title ?? ''}
        </Text>
        {isOpen && total > 0 ? (
          <Text className="text-foreground-secondary text-[14px]">{t`${done} of ${total}`}</Text>
        ) : null}
        {!isOpen ? (
          <View className="border-border rounded-full border px-3 py-1">
            <Text className="text-foreground-secondary text-[13px]">{t`Soon`}</Text>
          </View>
        ) : null}
      </View>

      {isOpen
        ? lessons?.map((lesson, i) => (
            <LessonRow key={lesson.id} lesson={lesson} index={i} isCurrent={lesson.id === currentLessonId} />
          ))
        : null}
    </View>
  )
}

interface LessonRowProps {
  lesson: {
    id: string
    title_en: string
    title_fr: string
    status: 'available' | 'coming_soon' | 'maintenance' | 'disabled' | null
    is_completed: boolean
    is_locked: boolean
  }
  index: number
  isCurrent: boolean
}

const LessonRow = ({ lesson, index, isCurrent }: LessonRowProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()

  const title = getValue(lesson, 'title')
  const open = lesson.status === 'available' || lesson.status === null
  const number = String(index + 1).padStart(2, '0')

  if (isCurrent && open && !lesson.is_locked) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${title}, ${t`continue`}`}
        onPress={() => router.push(`/lesson/${lesson.id}`)}
        className="bg-foreground -mx-4 mt-2 flex-row items-center rounded-[14px] px-4 py-4"
      >
        <Text className="text-background/60 w-9 text-[14px]">{number}</Text>
        <View className="flex-1">
          <Text weight="semibold" className="text-background text-[17px]">
            {title ?? ''}
          </Text>
        </View>
        <View className="bg-accent ml-3 h-9 w-9 items-center justify-center rounded-full">
          <PlayIcon size={16} weight="fill" className="text-white" />
        </View>
      </Pressable>
    )
  }

  const locked = lesson.is_locked || !open

  return (
    <Pressable
      accessibilityRole={locked ? 'text' : 'link'}
      accessibilityLabel={
        locked ? `${title}, ${t`locked`}` : lesson.is_completed ? `${title}, ${t`done`}` : (title ?? '')
      }
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={() => router.push(`/lesson/${lesson.id}`)}
      className={index === 0 ? 'flex-row items-center py-4' : 'border-border flex-row items-center border-t py-4'}
    >
      <Text className="text-foreground-secondary w-9 text-[14px]">{number}</Text>
      {/* A finished lesson keeps its title in full ink. It used to be struck through and
          dimmed, which read as cancelled rather than done -- and in this system a
          strikethrough means one specific thing, a wrong answer, which is what the spell,
          quiz and fill-blank steps use it for. A lesson you finished is also still open;
          it should not look less available than one you cannot reach yet. */}
      <Text className={locked ? 'text-foreground-secondary flex-1 text-[17px]' : 'text-foreground flex-1 text-[17px]'}>
        {title ?? ''}
      </Text>
      {/* One trailing slot, three states, so a unit reads as a column: done is the ink
          fill the system already uses for "settled", locked is the lock, and open is the
          caret. */}
      {lesson.is_completed ? (
        <View className="bg-foreground h-6 w-6 items-center justify-center rounded-full">
          <CheckIcon size={14} weight="bold" className="text-background" />
        </View>
      ) : locked ? (
        <LockIcon size={16} className="text-foreground-secondary" />
      ) : (
        <CaretRightIcon size={16} className="text-foreground-secondary" />
      )}
    </Pressable>
  )
}

export default LearnScreen
