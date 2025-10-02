import type { LessonStep } from '@/types/lesson-steps'

import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert } from 'react-native'

import { router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import {
  AudioStep,
  CompletionStep,
  ContentStep,
  ListenChooseStep,
  MatchPairsStep,
  OrderWordsStep,
  ProgressBar,
  QuizStep,
} from '@/components/lesson-steps'
import { Text, View } from '@/components/ui'
import { useAppCompleteLesson, useAppLesson, useAppLessonActivities, useAppLessonContent } from '@/hooks/use-app-data'
import { useLanguage } from '@/hooks/use-language'

const LessonScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const lessonId = id as string
  const { getValue, getJsonValue, currentLanguage } = useLanguage()

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAppLesson(lessonId)
  const { data: content, isLoading: contentLoading } = useAppLessonContent(lessonId)
  const { data: activities, isLoading: activitiesLoading } = useAppLessonActivities(lessonId)
  const completeLessonMutation = useAppCompleteLesson()

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<LessonStep[]>([])
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<Map<string, { answer: string; isCorrect: boolean }>>(new Map())

  // Build steps when data is loaded
  useEffect(() => {
    if (!lesson || !content) return

    const builtSteps: LessonStep[] = []
    let stepOrder = 0

    // Step 1: Content + Examples
    const contentText = getValue(content, 'content')
    const examples = getJsonValue<any, { kabiye: string; english?: string; french?: string }[]>(content, 'examples')

    if (contentText) {
      builtSteps.push({
        id: 'content',
        type: 'content',
        order: stepOrder++,
        content: contentText,
        examples: examples?.map((ex) => ({
          kabiye: ex.kabiye,
          translation: ex.english || ex.french || '',
        })),
      })
    }

    // Step 2: Audio (if available)
    if (content.audio_url) {
      builtSteps.push({
        id: 'audio',
        type: 'audio',
        order: stepOrder++,
        audioType: 'single',
        audioUrl: content.audio_url,
      })
    }

    // Step 3+: Activities (quizzes and exercises)
    if (activities && activities.length > 0) {
      activities.forEach((activity) => {
        const activityData = activity.data as any
        const question = getValue(activity, 'question') || getValue(activity, 'instructions') || ''

        // Handle different activity types
        if (activity.activity_type === 'match_pairs') {
          // Match pairs activity with translation support
          const rawPairs = activityData?.pairs || []

          // Transform pairs to use correct language for 'right' values
          const pairs = rawPairs.map((pair: any) => ({
            left: pair.left,
            right:
              typeof pair.right === 'object' ? pair.right[currentLanguage] || pair.right.en || pair.right : pair.right,
          }))

          if (pairs.length > 0) {
            builtSteps.push({
              id: `activity-${activity.id}`,
              type: 'match_pairs',
              order: stepOrder++,
              question,
              pairs,
            })
          }
        } else if (activity.activity_type === 'order_words') {
          // Order words activity
          const words = activityData?.words || []
          const correctOrder = activityData?.correctOrder || []
          if (words.length > 0 && correctOrder.length > 0) {
            builtSteps.push({
              id: `activity-${activity.id}`,
              type: 'order_words',
              order: stepOrder++,
              question,
              words,
              correctOrder,
            })
          }
        } else {
          // Quiz-type activities (multiple_choice, true_false, listen_choose, etc.)
          const optionsData = activityData?.options
          const options = optionsData?.[currentLanguage] || optionsData?.en || []

          if (options && options.length > 0) {
            const correctAnswer = activityData?.correct_answer || ''
            const explanationData = activityData?.explanation
            const explanation = explanationData?.[currentLanguage] || explanationData?.en || undefined
            const stepType = activity.activity_type === 'listen_choose' ? 'listen_choose' : 'quiz'

            builtSteps.push({
              id: `activity-${activity.id}`,
              type: stepType as any,
              order: stepOrder++,
              questionType: activity.activity_type as any,
              question,
              options,
              correctAnswer,
              explanation,
              audioUrl: activityData?.audio_url || activity.audio_url,
            })
          }
        }
      })
    }

    // Final Step: Completion
    builtSteps.push({
      id: 'completion',
      type: 'completion',
      order: stepOrder++,
    })

    setSteps(builtSteps)
  }, [lesson, content, activities, getValue, getJsonValue, currentLanguage])

  const handleStepComplete = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handleQuizAnswer = (isCorrect: boolean, answer: string) => {
    const currentStep = steps[currentStepIndex]

    // Track all interactive activities (quiz, listen_choose, match_pairs, order_words)
    if (
      currentStep.type === 'quiz' ||
      currentStep.type === 'listen_choose' ||
      currentStep.type === 'match_pairs' ||
      currentStep.type === 'order_words'
    ) {
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
      Alert.alert(t`Lesson Completed!`, t`Great job! You've completed this lesson.`, [
        {
          text: t`Continue`,
          onPress: () => router.back(),
        },
      ])
    } catch {
      Alert.alert(t`Error`, t`Failed to complete lesson. Please try again.`)
    }
  }

  // Loading state
  if (lessonLoading || contentLoading || activitiesLoading) {
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

  // Count all interactive activity steps (quiz, listen_choose, match_pairs, order_words)
  const totalQuizQuestions = steps.filter(
    (s) => s.type === 'quiz' || s.type === 'listen_choose' || s.type === 'match_pairs' || s.type === 'order_words'
  ).length

  // Render current step
  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStepIndex + 1} totalSteps={steps.length} />

      {/* Step Content */}
      <View className="flex-1">
        {currentStep.type === 'content' && (
          <ContentStep
            title={getValue(lesson, 'title') || undefined}
            difficulty={lesson?.difficulty}
            content={currentStep.content}
            examples={currentStep.examples}
            onContinue={handleStepComplete}
          />
        )}

        {currentStep.type === 'audio' && (
          <AudioStep
            audioType={currentStep.audioType}
            audioUrl={currentStep.audioUrl}
            conversation={currentStep.conversation}
            transcript={currentStep.transcript}
            onContinue={handleStepComplete}
          />
        )}

        {currentStep.type === 'quiz' && (
          <QuizStep
            questionType={currentStep.questionType}
            question={currentStep.question}
            options={currentStep.options}
            correctAnswer={currentStep.correctAnswer}
            explanation={currentStep.explanation}
            onAnswer={handleQuizAnswer}
          />
        )}

        {currentStep.type === 'listen_choose' && (
          <ListenChooseStep
            question={currentStep.question}
            options={currentStep.options}
            correctAnswer={currentStep.correctAnswer}
            audioUrl={currentStep.audioUrl}
            onAnswer={handleQuizAnswer}
          />
        )}

        {currentStep.type === 'match_pairs' && (
          <MatchPairsStep question={currentStep.question} pairs={currentStep.pairs} onAnswer={handleQuizAnswer} />
        )}

        {currentStep.type === 'order_words' && (
          <OrderWordsStep
            question={currentStep.question}
            words={currentStep.words}
            correctOrder={currentStep.correctOrder}
            onAnswer={handleQuizAnswer}
          />
        )}

        {currentStep.type === 'completion' && (
          <CompletionStep score={score} totalQuestions={totalQuizQuestions} onComplete={handleLessonComplete} />
        )}
      </View>
    </View>
  )
}

export default LessonScreen
