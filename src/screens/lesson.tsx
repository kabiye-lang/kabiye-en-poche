import type { LessonStep } from '@/types/lesson-steps'

import { useEffect, useState } from 'react'
import { ActivityIndicator } from 'react-native'

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

const LessonScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const lessonId = id as string
  const { getValue } = useLanguage()

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAppLesson(lessonId)
  const { data: contents, isLoading: contentsLoading } = useAppLessonContents(lessonId)
  const { data: activities, isLoading: activitiesLoading } = useAppLessonActivities(lessonId)
  const completeLessonMutation = useAppCompleteLesson()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<LessonStep[]>([])
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<Map<string, { answer: string; isCorrect: boolean }>>(new Map())

  // Build steps when data is loaded
  useEffect(() => {
    if (!lesson || !contents || contents.length === 0) return

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
          type: activity.activity_type as any,
          order: stepOrder++,
          activity, // Pass the whole activity to the component
        })
      })
    }

    // Final Step: Completion
    builtSteps.push({
      id: 'completion',
      type: 'completion',
      order: stepOrder++,
    })

    setSteps(builtSteps)
  }, [lesson, contents, activities, getValue])

  const handleStepComplete = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
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
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="mt-4">{t`Loading lesson...`}</Text>
      </View>
    )
  }

  // Error state
  if (lessonError || !lesson) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4 dark:bg-gray-900">
        <Text variant="h6" className="text-center text-primary">
          {t`Failed to load lesson`}
        </Text>
        <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
          {lessonError?.message || t`Lesson not found`}
        </Text>
      </View>
    )
  }

  // No steps available
  if (steps.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-4 dark:bg-gray-900">
        <Text variant="h6" className="text-center text-primary">
          {t`Lesson content will be available soon.`}
        </Text>
      </View>
    )
  }

  const currentStep = steps[currentStepIndex]

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

  // Render current step
  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStepIndex + 1} totalSteps={steps.length} />

      {/* Step Content */}
      <View className="flex-1">
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

        {currentStep.type === 'audio' ? (
          <AudioStep
            audioType={currentStep.audioType}
            audioUrl={currentStep.audioUrl}
            conversation={currentStep.conversation}
            transcript={currentStep.transcript}
            onContinue={handleStepComplete}
          />
        ) : null}

        {currentStep.type === 'multiple_choice' || currentStep.type === 'true_false' ? (
          <QuizStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
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
          <CompletionStep score={score} totalQuestions={totalQuizQuestions} onComplete={handleLessonComplete} />
        ) : null}
      </View>
    </View>
  )
}

export default LessonScreen
