import type { AudioActivityData } from '../types/activity-data'
import type { ActivityStep, LessonStep } from '../types/lesson-steps'

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
  ReadChooseStep,
  SpellStep,
  SpotLetterStep,
} from '../components/lesson-steps'
import { Text, View } from '../components/ui'
import { useAppCompleteLesson, useAppLesson, useAppLessonActivities, useAppLessonContents } from '../hooks/use-app-data'
import { useLanguage } from '../hooks/use-language'
import { hasActivity } from '../types/lesson-steps'
import { usableAudioUrl } from '../utils/audio-source'
import { spellingVariants } from '../utils/kabiye-variants'

/**
 * Whether an activity has enough data to be answered.
 *
 * A step component that renders nothing is worse than a missing step: the learner lands
 * on a blank screen with the progress bar advanced and no control to move on. So the
 * decision is made here, while the step list is being built, and an activity that cannot
 * be answered is never added.
 *
 * Two reasons an activity fails:
 *
 * - **No recording.** "Listen and choose", "listen and type" and plain audio exist only
 *   to deliver one. Without usable audio (see utils/audio-source) the first two ask the
 *   learner to identify a word they were never played, and the third has nothing to
 *   deliver. They reappear on their own once real recordings are hosted.
 * - **Not enough to choose between.** `spot_letter` builds its wrong answers by
 *   substituting the letters French cannot write, so a word with only one of them yields
 *   one distractor and a two-option question -- a coin flip, which is why `true_false`
 *   was retired. `read_choose` needs a sentence and at least two readings.
 */
const isAnswerable = (activity: { activity_type: string; data: unknown }): boolean => {
  const data = (activity.data ?? {}) as {
    audio_url?: string
    audioUrl?: string
    correct?: string
    distractors?: string[]
    sentence?: string
    options?: Record<string, string[]>
  }

  if (AUDIO_DEPENDENT_ACTIVITIES.has(activity.activity_type)) {
    return usableAudioUrl(data.audio_url ?? data.audioUrl) !== undefined
  }

  if (activity.activity_type === 'spot_letter') {
    const correct = data.correct?.trim() ?? ''
    if (!correct) return false
    const supplied = (data.distractors ?? []).filter((d) => d && d !== correct)
    return supplied.length >= 2 || spellingVariants(correct, 2).length >= 2
  }

  if (activity.activity_type === 'read_choose') {
    const anyOptions = Object.values(data.options ?? {}).find((list) => (list?.length ?? 0) >= 2)
    return Boolean(data.sentence?.trim()) && anyOptions !== undefined
  }

  return true
}

const AUDIO_DEPENDENT_ACTIVITIES = new Set(['audio', 'listen_choose', 'listen_type'])

/**
 * Step types the learner can get wrong.
 *
 * Content and completion are not answerable, so they are neither scored nor re-queued.
 * The list was spelled out twice before -- once for scoring and once for the question
 * count -- and the two had already drifted apart.
 */
const INTERACTIVE_STEPS = new Set<LessonStep['type']>([
  'listen_choose',
  'listen_type',
  'match_pairs',
  'order_words',
  'fill_blank',
  'multiple_choice',
  'true_false',
  'spell',
  'spot_letter',
  'read_choose',
])

const isInteractive = (step: LessonStep) => INTERACTIVE_STEPS.has(step.type)

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

  /**
   * Steps the learner got wrong, re-asked before the lesson ends.
   *
   * A mistake that simply scrolls past teaches nothing; the handoff's flow is
   * teach -> try -> and the ones you missed come back. Held as ids rather than indices
   * because the queue is appended to the step list, so indices move.
   */
  const [missed, setMissed] = useState<string[]>([])
  const [retriesQueued, setRetriesQueued] = useState(false)

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
      activities.filter(isAnswerable).forEach((activity) => {
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

  /**
   * The steps actually walked: the lesson, then the ones that were missed, then finish.
   *
   * Retries are copies with a `retry-` id so a second miss is not queued again and the
   * answer map keeps both attempts.
   */
  const walkedSteps = useMemo<LessonStep[]>(() => {
    if (!retriesQueued || missed.length === 0) return steps

    const completion = steps[steps.length - 1]
    const body = steps.slice(0, -1)
    const retries = missed
      .map((id) => body.find((step) => step.id === id))
      .filter((step): step is LessonStep => step != null)
      .map((step, i) => ({ ...step, id: `retry-${step.id}`, order: body.length + i }) as LessonStep)

    return [...body, ...retries, { ...completion, order: body.length + retries.length }]
  }, [steps, missed, retriesQueued])

  /**
   * Advance, re-asking missed steps before the lesson is allowed to finish.
   *
   * The retry queue is spliced in once, when the learner first reaches the completion
   * step with misses outstanding. Doing it here rather than in the `steps` memo keeps
   * the queue out of the progress denominator until it exists, so the bar does not
   * lengthen behind the learner as they make mistakes.
   */
  const handleStepComplete = () => {
    const next = currentStepIndex + 1
    const reachedEnd = next >= walkedSteps.length - 1

    if (reachedEnd && missed.length > 0 && !retriesQueued) {
      setRetriesQueued(true)
      setCurrentStepIndex(next)
      return
    }
    setCurrentStepIndex((prev) => (prev < walkedSteps.length - 1 ? prev + 1 : prev))
  }

  const handleQuizAnswer = (isCorrect: boolean, answer: string) => {
    const currentStep = walkedSteps[currentStepIndex]

    if (isInteractive(currentStep)) {
      const newAnswers = new Map(answers)
      newAnswers.set(currentStep.id, { answer, isCorrect })
      setAnswers(newAnswers)

      if (isCorrect) {
        setScore(score + 1)
      } else if (!currentStep.id.startsWith('retry-')) {
        // Queue the miss once. A step re-asked and missed again is not queued a second
        // time -- the lesson has to end, and drilling the same word forever is a
        // different product than this one.
        setMissed((prev) => (prev.includes(currentStep.id) ? prev : [...prev, currentStep.id]))
      }
    }

    // Move to next step
    handleStepComplete()
  }

  const handleLessonComplete = async () => {
    // "Back to Lessons" used to record the lesson and stop there, leaving the learner
    // on the completion screen with no way out but the close button -- and every
    // further tap fired the mutation again. Record it, then actually go back.
    if (completeLessonMutation.isPending) return

    try {
      await completeLessonMutation.mutateAsync(lessonId)
      toast.success(t`Lesson Completed!`, {
        description: t`Great job! You've completed this lesson.`,
      })
      router.back()
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
  if (walkedSteps.length === 0) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Text variant="h6" className="text-primary text-center">
          {t`Lesson content will be available soon.`}
        </Text>
      </View>
    )
  }

  const currentStep = walkedSteps[currentStepIndex]

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

  const totalQuizQuestions = walkedSteps.filter(isInteractive).length

  const totalContentSteps = walkedSteps.filter((s) => s.type === 'content').length

  // Render current step
  return (
    <View className="bg-background flex-1">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStepIndex + 1} totalSteps={walkedSteps.length} />

      {/* Step Content — keyed so each new step triggers the entering animation */}
      <Animated.View
        key={currentStep.id}
        entering={currentStep.type === 'completion' ? FadeIn.duration(220) : FadeInRight.duration(260)}
        className="flex-1"
      >
        {currentStep.type === 'content' ? (
          <ContentStep
            // Only the opening slide carries the lesson title and difficulty. It used to
            // repeat on every content step and then disappear for the activities, so the
            // heaviest type on the screen was the one thing that had not changed.
            lessonTitle={currentStep.id === 'content-0' ? getValue(lesson, 'title') || undefined : undefined}
            difficulty={currentStep.id === 'content-0' ? lesson?.difficulty : undefined}
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
            progressPercent={Math.round((currentStepIndex / Math.max(walkedSteps.length - 1, 1)) * 100)}
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

        {currentStep.type === 'spell' && 'activity' in currentStep && (
          <SpellStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
        )}

        {currentStep.type === 'spot_letter' && 'activity' in currentStep && (
          <SpotLetterStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
        )}

        {currentStep.type === 'read_choose' && 'activity' in currentStep && (
          <ReadChooseStep activity={currentStep.activity} onAnswer={handleQuizAnswer} />
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
