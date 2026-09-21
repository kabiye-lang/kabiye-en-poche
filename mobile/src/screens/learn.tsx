import type { LearnerPath } from '../hooks/use-path'
import type { LessonWithProgress } from '../types/supabase'

import { Pressable, ScrollView } from 'react-native'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { CaretRightIcon, CheckIcon, LockIcon, PlayIcon } from '../components/icons'
import { Skeleton, SkeletonRows, Text, View } from '../components/ui'
import { useAppNextLesson, useAppPathLessons, useAppUnits } from '../hooks/use-app-data'
import { useLanguage } from '../hooks/use-language'
import { orderUnitsForPath, usePath } from '../hooks/use-path'
import { partitionLearnPath } from '../utils/learn-path'
import { isWritten } from '../utils/lesson-status'

/** How many coming units are named before the rest are counted. */
const COMING_TITLES_SHOWN = 5

/**
 * The whole path on one screen.
 *
 * Units used to be cards you tapped into, which put a navigation step between the
 * learner and the only thing they came for -- the next lesson -- and hid how far the
 * curriculum went. Laterite makes the units chapters of a single list: every written
 * lesson is visible, the current one is an ink card you can start from here, and what is
 * finished keeps its title and gains a check, rather than being removed. Lessons still
 * only planned are gathered in one quiet block at the end, rather than a "Soon" pill
 * scattered across the chapters that held them (design review 2026-09-21).
 */
const LearnScreen = () => {
  const { t } = useLingui()
  const { getValue } = useLanguage()
  // Inside the component so the macro can translate them: as a module constant these
  // stayed English on a French screen.
  const pathDescription: Record<LearnerPath, string> = {
    speaker: t`Set for someone who already speaks Kabiyè.`,
    heritage: t`Set for someone who grew up hearing Kabiyè.`,
    new: t`Set for someone new to Kabiyè.`,
  }
  const { data: units, isLoading: unitsLoading, error: unitsError } = useAppUnits()
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError } = useAppPathLessons()
  const { data: nextLesson } = useAppNextLesson()
  const { path } = usePath()

  const isLoading = unitsLoading || lessonsLoading
  const error = unitsError || lessonsError

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

  const ordered = orderUnitsForPath(units ?? [], path)
  const pathUnits = ordered.map((unit) => ({ ...unit, title: getValue(unit, 'title') ?? '' }))
  const { units: chapters, coming } = partitionLearnPath(pathUnits, lessons ?? [])

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="px-6 pb-10 pt-16">
      <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Learn`}</Text>
      <Text weight="semibold" className="text-foreground mt-2 text-[40px] leading-[1.0]">
        {t`Your path`}
      </Text>

      <View className="mt-3 flex-row flex-wrap items-baseline gap-2">
        <Text className="text-foreground-secondary text-[15px]">{path ? pathDescription[path] : t`Not set yet.`}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(onboarding)')}
          // The visible label is a short underlined word, well under 44pt on its own.
          // Padding, cancelled by an equal negative margin, makes the pressable itself
          // 44pt tall without moving the line; `hitSlop` does not widen the native
          // hit-test on this architecture (see the search button in screens/home.tsx).
          className="-my-[13px] py-[13px]"
        >
          <Text className="text-foreground text-[15px] underline">{t`Change`}</Text>
        </Pressable>
      </View>

      <View className="mt-8">
        {chapters.map(({ unit, lessons: unitLessons }) => (
          <UnitChapter key={unit.id} unit={unit} lessons={unitLessons} currentLessonId={nextLesson?.lesson.id} />
        ))}
      </View>

      {coming.count > 0 ? (
        <View className="border-border mt-2 border-t-[1.5px] pt-6">
          <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">
            {t`More lessons coming`}
          </Text>
          <Text className="text-foreground-secondary mt-2 text-[15px] leading-[1.4]">
            {coming.count === 1
              ? t`One more lesson is being written.`
              : t`${coming.count} more lessons are being written.`}
          </Text>
          {/* The next few units by name, then a count. Listing all of them -- some seventy
              titles, three screens of scrolling -- put the weight back on what is not
              written, which is what this block exists to stop doing. */}
          <View className="mt-3">
            {coming.unitTitles.slice(0, COMING_TITLES_SHOWN).map((title) => (
              <Text key={title} accessibilityRole="text" className="text-foreground-secondary py-1 text-[15px]">
                {title}
              </Text>
            ))}
            {coming.unitTitles.length > COMING_TITLES_SHOWN ? (
              <Text accessibilityRole="text" className="text-foreground-secondary py-1 text-[15px]">
                {coming.unitTitles.length - COMING_TITLES_SHOWN === 1
                  ? t`and one more unit`
                  : t`and ${coming.unitTitles.length - COMING_TITLES_SHOWN} more units`}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
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
  /** Only the lessons this chapter lists -- written or under maintenance. */
  lessons: LessonWithProgress[]
  /** The one lesson to resume, across the whole path. */
  currentLessonId?: string
}

const UnitChapter = ({ unit, lessons, currentLessonId }: UnitChapterProps) => {
  const { t } = useLingui()
  const { getValue } = useLanguage()

  const title = getValue(unit, 'title')
  const done = lessons.filter((lesson) => lesson.is_completed).length
  // "Total" here means the written lessons only -- maintenance rows are listed but were
  // never something to finish, so counting them would make "3 of 4" claim a 4th lesson
  // the learner could never actually complete.
  const total = lessons.filter((lesson) => isWritten(lesson.status)).length

  // The ink card marks where to resume, and there is exactly one of those on the screen.
  // Computing it per unit gave every unit its own -- three "continue here" cards on one
  // path, which is three answers to a question that has one. `useAppNextLesson` already
  // knows the globally next lesson, so the unit only asks whether it holds it.
  return (
    <View className="mb-9">
      <View className="border-foreground flex-row items-baseline border-b-[1.5px] pb-2">
        <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">
          {unit.code ? unit.code.replace(/^U0*/, t`Unit ` + '') : t`Unit`}
        </Text>
        <Text weight="semibold" className="text-foreground ml-3 flex-1 text-[22px] leading-[1.15]">
          {title ?? ''}
        </Text>
        {total > 0 ? <Text className="text-foreground-secondary text-[14px]">{t`${done} of ${total}`}</Text> : null}
      </View>

      {lessons.map((lesson, i) => (
        <LessonRow key={lesson.id} lesson={lesson} index={i} isCurrent={lesson.id === currentLessonId} />
      ))}
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
  const number = String(index + 1).padStart(2, '0')
  const rowClassName = index === 0 ? 'flex-row items-center py-4' : 'border-border flex-row items-center border-t py-4'

  // A row under maintenance is listed so the learner still knows it exists, but it is
  // never pressable -- there is nothing to open, and "locked" would wrongly say it is
  // gated by progress rather than being worked on.
  if (lesson.status === 'maintenance') {
    return (
      <View accessibilityRole="text" className={rowClassName}>
        <Text className="text-foreground-secondary w-9 text-[14px]">{number}</Text>
        <Text className="text-foreground-secondary flex-1 text-[17px]">{title ?? ''}</Text>
        <Text className="text-foreground-secondary text-[13px]">{t`Being corrected.`}</Text>
      </View>
    )
  }

  if (isCurrent && !lesson.is_locked) {
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
        {/* Decorative -- the row above is the tappable target and is already well past
            44pt tall, so this circle does not need its own hit area. */}
        <View className="bg-accent-fill ml-3 h-9 w-9 items-center justify-center rounded-full">
          <PlayIcon size={16} weight="fill" className="text-on-accent" />
        </View>
      </Pressable>
    )
  }

  const locked = lesson.is_locked

  return (
    <Pressable
      accessibilityRole={locked ? 'text' : 'link'}
      accessibilityLabel={
        locked ? `${title}, ${t`locked`}` : lesson.is_completed ? `${title}, ${t`done`}` : (title ?? '')
      }
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={() => router.push(`/lesson/${lesson.id}`)}
      className={rowClassName}
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
