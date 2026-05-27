import type { AudioActivityData } from '@/types/activity-data'
import type { ActivityStep, LessonStep } from '@/types/lesson-steps'

import { useMemo, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated'

import { router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { toast } from 'sonner-native'

import {
  AudioStep,
  CompletionStep,
  ContentStep,
  FillBlankStep,
  ListenChooseStep,
  ListenTypeStep,
  MatchPairsStep,
  OrderWordsStep,
  ProgressBar,
  QuizStep,
} from '@/components/lesson-steps'
import { Text, View } from '@/components/ui'
import { useAppCompleteLesson, useAppLesson, useAppLessonActivities, useAppLessonContents } from '@/hooks/use-app-data'
import { useLanguage } from '@/hooks/use-language'
import { hasActivity } from '@/types/lesson-steps'

const LessonScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const lessonId = id as string
  const { getValue, getJsonValue } = useLanguage()

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAppLesson(lessonId)
  const { data: contents, isLoading: contentsLoading } = useAppLessonContents(lessonId)
  const { data: activities, isLoading: activitiesLoading } = useAppLessonActivities(lessonId)
  const completeLessonMutation = useAppCompleteLesson()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<Map<string, { answer: string; isCorrect: boolean }>>(new Map())

  // Build steps when data is loaded (derived from lesson data, no useEffect needed)
  const steps = useMemo<LessonStep[]>(() => {
    if (!lesson || !contents || contents.length === 0) return []

    const builtSteps: LessonStep[] = []
    let stepOrder = 0

    // Add all content sections (supports multiple contents per lesson)
    contents.forEach((content, contentIndex) => {
      // Content + Examples step
      const contentText = getValue(content, 'content')

      if (contentText) {
        builtSteps.push({
          id: `content-${contentIndex}`,
          type: 'content',
          order: stepOrder++,
          content: contentText,
          title: getValue(content, 'title') || undefined,
          examples: content.examples || undefined, // Pass raw examples, ContentStep will transform them
        })
      }
    })

    // Step 3+: Activities (quizzes and exercises)
    // Each component will handle its own data transformation
    if (activities && activities.length > 0) {
      activities.forEach((activity) => {
        builtSteps.push({
          id: `activity-${activity.id}`,
          type: activity.activity_type as ActivityStep['type'],
          order: stepOrder++,
          activity,
        })
      })
    }

    // Final Step: Completion
    builtSteps.push({
      id: 'completion',
      type: 'completion',
      order: stepOrder++,
    })

    return builtSteps
  }, [lesson, contents, activities, getValue])

  const handleStepComplete = () => {
    setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev))
  }

  const handleQuizAnswer = (isCorrect: boolean, answer: string) => {
    const currentStep = steps[currentStepIndex]

    // Track all interactive activities
    const isActivity =
      currentStep.type === 'listen_choose' ||
      currentStep.type === 'listen_type' ||
      currentStep.type === 'match_pairs' ||
      currentStep.type === 'order_words' ||
      currentStep.type === 'fill_blank' ||
      currentStep.type === 'multiple_choice' ||
      currentStep.type === 'true_false'

    if (isActivity) {
      // Save answer
      const newAnswers = new Map(answers)
      newAnswers.set(currentStep.id, { answer, isCorrect })
      setAnswers(newAnswers)

      // Update score
      if (isCorrect) {
        setScore(score + 1)
      }
    }

    // Move to next step
    handleStepComplete()
  }

  const handleLessonComplete = async () => {
    try {
      await completeLessonMutation.mutateAsync(lessonId)
      toast.success(t`Lesson Completed!`, {
        description: t`Great job! You've completed this lesson.`,
        action: {
          label: t`Continue`,
          onClick: () => router.back(),
        },
      })
    } catch {
      toast.error(t`Error`, {
        description: t`Failed to complete lesson. Please try again.`,
      })
    }
  }

  // Loading state
  if (lessonLoading || contentsLoading || activitiesLoading) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="mt-4">{t`Loading lesson...`}</Text>
      </View>
    )
  }

  // Block access when lesson is not available
  const isLessonAvailable = lesson?.status === 'available' || lesson?.status === null
  if (lesson && !isLessonAvailable) {
    const statusMessage =
      lesson.status === 'coming_soon'
        ? t`This lesson is coming soon!`
        : lesson.status === 'maintenance'
          ? t`This lesson is under maintenance`
          : lesson.status === 'disabled'
            ? t`This lesson is temporarily unavailable`
            : t`This lesson is not available`

    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Text variant="h6" className="text-primary text-center">
          {statusMessage}
        </Text>
        <Text variant="caption" className="text-foreground-secondary mt-2 text-center">
          {t`Please check back later`}
        </Text>
      </View>
    )
  }

  // Error state
  if (lessonError || !lesson) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Text variant="h6" className="text-primary text-center">
          {t`Failed to load lesson`}
        </Text>
        <Text variant="caption" className="text-foreground-secondary mt-2 text-center">
          {lessonError?.message || t`Lesson not found`}
        </Text>
      </View>
    )
  }

  // No steps available
  if (steps.length === 0) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Text variant="h6" className="text-primary text-center">
          {t`Lesson content will be available soon.`}
        </Text>
      </View>
    )
  }

  const currentStep = steps[currentStepIndex]

  // Audio step props (extracted for type narrowing)
  const audioStepContent =
    currentStep.type === 'audio' && hasActivity(currentStep)
      ? (() => {
          const data = currentStep.activity.data as AudioActivityData
          return (
            <AudioStep
              audioType={data?.audioType ?? 'single'}
              audioUrl={data?.audioUrl}
              conversation={getJsonValue(data ?? null, 'conversation') ?? data?.conversation}
              transcript={getValue(data ?? null, 'transcript') ?? data?.transcript ?? undefined}
              onContinue={handleStepComplete}
            />
          )
        })()
      : null

  // Count all interactive activity steps
  const totalQuizQuestions = steps.filter(
    (s) =>
      s.type === 'listen_choose' ||
      s.type === 'listen_type' ||
      s.type === 'match_pairs' ||
      s.type === 'order_words' ||
      s.type === 'fill_blank' ||
      s.type === 'multiple_choice' ||
      s.type === 'true_false'
  ).length

  const totalContentSteps = steps.filter((s) => s.type === 'content').length

  // Render current step
  return (
    <View className="bg-background flex-1">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStepIndex + 1} totalSteps={steps.length} />

      {/* Step Content — keyed so each new step triggers the entering animation */}
      <Animated.View
        key={currentStep.id}
        entering={currentStep.type === 'completion' ? FadeIn.duration(220) : FadeInRight.duration(260)}
        className="flex-1"
      >
        {currentStep.type === 'content' ? (
          <ContentStep
            lessonTitle={getValue(lesson, 'title') || undefined}
            difficulty={lesson?.difficulty}
            title={currentStep.title}
            content={currentStep.content}
            examples={currentStep.examples}
            onContinue={handleStepComplete}
          />
        ) : null}

        {audioStepContent}

        {currentStep.type === 'multiple_choice' || currentStep.type === 'true_false' ? (
          <QuizStep
            activity={currentStep.activity}
            onAnswer={handleQuizAnswer}
            progressPercent={Math.round((currentStepIndex / Math.max(steps.length - 1, 1)) * 100)}
          />
        ) : null}

        {currentStep.type === 'fill_blank' ? (
          <FillBlankStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
        ) : null}

        {currentStep.type === 'listen_choose' && 'activity' in currentStep && (
          <ListenChooseStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
        )}

        {currentStep.type === 'listen_type' && 'activity' in currentStep && (
          <ListenTypeStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
        )}

        {currentStep.type === 'match_pairs' && 'activity' in currentStep && (
          <MatchPairsStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
        )}

        {currentStep.type === 'order_words' && 'activity' in currentStep && (
          <OrderWordsStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
        )}

        {currentStep.type === 'completion' ? (
          <CompletionStep
            score={score}
            totalQuestions={totalQuizQuestions}
            contentSteps={totalContentSteps}
            onComplete={handleLessonComplete}
          />
        ) : null}
      </Animated.View>
    </View>
  )
}

export default LessonScreen
