import type { AudioActivityData } from '../types/activity-data'
import type { ActivityStep, LessonExample, LessonStep } from '../types/lesson-steps'

import { useMemo, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated'

import { router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { toast } from 'sonner-native'

import {
  AudioStep,
  ContentStep,
  CoverStep,
  FillBlankStep,
  FinishStep,
  ListenChooseStep,
  ListenTypeStep,
  MatchPairsStep,
  OrderWordsStep,
  ProgressBar,
  QuizStep,
  ReadChooseStep,
  SpellStep,
  SpotLetterStep,
  TeachStep,
} from '../components/lesson-steps'
import { Text, View } from '../components/ui'
import { useAppCompleteLesson, useAppLesson, useAppLessonActivities, useAppLessonContents } from '../hooks/use-app-data'
import { useLanguage } from '../hooks/use-language'
import { useMyWords } from '../hooks/use-my-words'
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

/**
 * How many words a lesson teaches when the content does not say.
 *
 * A Laterite lesson is a handful of words the learner will remember, not an inventory:
 * the cover promises them by name, each gets a screen, and the finish counts them. Eight
 * is the top of what that shape carries.
 *
 * Content written for the old model has no opinion here -- it lists every word its prose
 * mentions, which for the lessons shipping today is twenty-nine. Teaching all of them
 * produced a forty-seven-step lesson and a cover that scrolled.
 */
const MAX_TAUGHT_WORDS = 8

const LessonScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const lessonId = id as string
  const { getValue, getJsonValue } = useLanguage()

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAppLesson(lessonId)
  const { data: contents, isLoading: contentsLoading } = useAppLessonContents(lessonId)
  const { data: activities, isLoading: activitiesLoading } = useAppLessonActivities(lessonId)
  const completeLessonMutation = useAppCompleteLesson()
  const { addMet, markWritten, readCount } = useMyWords()

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

  /**
   * The words this lesson teaches, in the order it teaches them.
   *
   * The cover promises this list, each word gets a Teach card, and the finish counts it
   * -- one source, so the three cannot disagree.
   *
   * A word is taught if it carries a `note`: the two or three sentences the Teach card
   * shows. That is the right criterion rather than a flag, because a card with no note
   * is just the word and its gloss again, which the cover already showed. Content
   * generated before this change carries no notes at all, so it falls back to the first
   * few single words -- readable, and visibly thinner than a lesson written for this
   * shape, which is the honest signal that it should be regenerated.
   */
  const words = useMemo<LessonExample[]>(() => {
    if (!contents) return []
    const seen = new Set<string>()
    const all: LessonExample[] = []
    for (const content of contents) {
      for (const raw of (content.examples as LessonExample[] | null) ?? []) {
        const kbp = raw?.kbp?.trim()
        // A phrase built from words taught earlier is an example, not a new word: it
        // belongs in the prose, not on a card of its own.
        if (!kbp || seen.has(kbp) || kbp.includes(' ')) continue
        seen.add(kbp)
        all.push(raw)
      }
    }
    const authored = all.filter((word) => word.note_en || word.note_fr)
    return authored.length > 0 ? authored : all.slice(0, MAX_TAUGHT_WORDS)
  }, [contents])

  /**
   * Steps, in the Laterite order: cover, then each word taught and immediately practised,
   * then whatever is left over.
   *
   * The old order was every content section, then every activity -- a learner met `sɛtʋ`
   * in the middle of the second paragraph and was asked to spell it eleven screens later.
   * Pairing them is the whole point of the change.
   *
   * Activities are matched to a word by `lexeme_id` when the row carries one, and
   * otherwise by looking for the word in the activity's own data. Rows generated before
   * this change carry neither, so anything unmatched runs after the paired steps rather
   * than being dropped.
   */
  const steps = useMemo<LessonStep[]>(() => {
    if (!lesson || !contents || contents.length === 0) return []

    const built: LessonStep[] = []
    let order = 0

    built.push({ id: 'cover', type: 'cover', order: order++, words })

    const answerable = (activities ?? []).filter(isAnswerable)
    const claimed = new Set<string>()

    const activityWord = (activity: { data: unknown }): string | undefined => {
      const data = (activity.data ?? {}) as { lexeme_id?: string; answer?: unknown; correct?: string }
      if (typeof data.lexeme_id === 'string') return data.lexeme_id
      if (typeof data.correct === 'string') return data.correct
      if (typeof data.answer === 'string') return data.answer
      return undefined
    }

    for (const word of words) {
      built.push({ id: `teach-${word.kbp}`, type: 'teach', order: order++, example: word })

      const paired = answerable.find((activity) => {
        if (claimed.has(activity.id)) return false
        const ref = activityWord(activity)
        return ref === word.kbp || ref === word.lexeme_id
      })
      if (paired) {
        claimed.add(paired.id)
        built.push({
          id: `activity-${paired.id}`,
          type: paired.activity_type as ActivityStep['type'],
          order: order++,
          activity: paired,
        })
      }
    }

    for (const activity of answerable) {
      if (claimed.has(activity.id)) continue
      built.push({
        id: `activity-${activity.id}`,
        type: activity.activity_type as ActivityStep['type'],
        order: order++,
        activity,
      })
    }

    built.push({ id: 'completion', type: 'completion', order: order++ })
    return built
  }, [lesson, contents, activities, words])

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

    // Reaching the end means these words have been met, whether or not the learner
    // taps through the finish screen -- closing the lesson there should not lose them.
    if (next >= walkedSteps.length - 1 && words.length > 0) {
      void addMet(words.map((word) => ({ headword: word.kbp, lexemeId: word.lexeme_id })))
    }

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
        // Spelling a word correctly is the only evidence the app has that someone can
        // write it, so it is what Profile counts. Recognising it in a multiple choice
        // is not the same claim.
        if (currentStep.type === 'spell') void markWritten(answer.normalize('NFC').trim())
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

  /**
   * The words that were missed once and re-asked, for the finish screen to name.
   *
   * A missed step is matched back to its word through the teach step that precedes it,
   * which is the only place the pairing is recorded.
   */
  const retriedWords = missed
    .map((id) => {
      const index = steps.findIndex((step) => step.id === id)
      for (let i = index - 1; i >= 0; i--) {
        const step = steps[i]
        if (step.type === 'teach') return step.example.kbp
      }
      return undefined
    })
    .filter((word): word is string => word !== undefined)

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
        {currentStep.type === 'cover' ? (
          <CoverStep
            title={getValue(lesson, 'title') || ''}
            description={getValue(lesson, 'description') || undefined}
            words={currentStep.words}
            onBegin={handleStepComplete}
          />
        ) : null}

        {currentStep.type === 'teach' ? (
          <TeachStep example={currentStep.example} onContinue={handleStepComplete} />
        ) : null}

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
          <FinishStep
            words={words}
            retried={retriedWords}
            savedTotal={readCount > 0 ? readCount : undefined}
            onDone={handleLessonComplete}
            isBusy={completeLessonMutation.isPending}
          />
        ) : null}
      </Animated.View>
    </View>
  )
}

export default LessonScreen
