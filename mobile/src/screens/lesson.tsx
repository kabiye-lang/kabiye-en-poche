import type { AudioActivityData } from '../types/activity-data'
import type { ActivityStep, LessonExample, LessonStep } from '../types/lesson-steps'
import type { Effect } from '../utils/lesson-session'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AccessibilityInfo, BackHandler, findNodeHandle, Pressable, View as RNView } from 'react-native'
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated'

import { router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { toast } from 'sonner-native'

import { EmptyState } from '../components/empty-state'
import {
  AudioStep,
  ContentStep,
  CoverStep,
  DialogueStep,
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
  TeachContent,
  TeachStep,
} from '../components/lesson-steps'
import { Button, Skeleton, SkeletonRows, Text, View } from '../components/ui'
import {
  useAppCompleteLesson,
  useAppLesson,
  useAppLessonActivities,
  useAppLessonContents,
  useAppProgressSummary,
} from '../hooks/use-app-data'
import { useLanguage } from '../hooks/use-language'
import { useLessonSession } from '../hooks/use-lesson-session'
import { useMyWords } from '../hooks/use-my-words'
import { hasActivity } from '../types/lesson-steps'
import { usableAudioUrl } from '../utils/audio-source'
import { spellingVariants } from '../utils/kabiye-variants'
import { practisedWords } from '../utils/lesson-outcomes'
import { progressView as computeProgressView, reviewOutcomes } from '../utils/lesson-session'
import { isWritten } from '../utils/lesson-status'
import { dialogueTurns, placeSections, sectionSentences } from '../utils/section-kinds'

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

/** A stable empty step list: what the session hook sees until the lesson has loaded. */
const NO_STEPS: readonly LessonStep[] = []

const LessonScreen = () => {
  const { t } = useLingui()
  const { id } = useLocalSearchParams()
  const lessonId = id as string
  const { getValue, getJsonValue } = useLanguage()

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useAppLesson(lessonId)
  const { data: progressSummary } = useAppProgressSummary()
  const { data: contents, isLoading: contentsLoading, error: contentsError } = useAppLessonContents(lessonId)
  const { data: activities, isLoading: activitiesLoading, error: activitiesError } = useAppLessonActivities(lessonId)
  const completeLessonMutation = useAppCompleteLesson()
  const { addMet, markWritten } = useMyWords()

  // Finish never claims a save the app has not confirmed: this is set only once the
  // `addMet` write actually resolves, not the instant it is fired.
  const [savedTotal, setSavedTotal] = useState<number | undefined>(undefined)

  /** Whether the "Show the word again" overlay is open over the current review item.
   *  Ephemeral UI state, not part of the persisted session -- see the Goal's guarantee
   *  boundary: only submitted answers are restored, and this is not one. */
  const [showWordOverlay, setShowWordOverlay] = useState(false)
  const overlayHeadingRef = useRef<RNView>(null)

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
  const { words, sectionOf } = useMemo(() => {
    const sectionOf = new Map<LessonExample, number>()
    if (!contents) return { words: [] as LessonExample[], sectionOf }
    const seen = new Set<string>()
    const all: LessonExample[] = []
    // A dialogue's turns and a note's text are not words to teach; only prose sections
    // carry the noted examples the cover promises. Each word remembers its section, so
    // the section's rule can follow the words it is about.
    placeSections(contents).prose.forEach((content, index) => {
      for (const raw of (content.examples as LessonExample[] | null) ?? []) {
        const kbp = raw?.kbp?.trim()
        // A phrase built from words taught earlier is an example, not a new word: it
        // belongs in the prose, not on a card of its own.
        if (!kbp || seen.has(kbp) || kbp.includes(' ')) continue
        seen.add(kbp)
        all.push(raw)
        sectionOf.set(raw, index)
      }
    })
    const authored = all.filter((word) => word.note?.en || word.note?.fr)
    return { words: authored.length > 0 ? authored : all.slice(0, MAX_TAUGHT_WORDS), sectionOf }
  }, [contents])

  /**
   * Steps, in the Laterite order: cover, then each word taught and immediately practised,
   * then whatever is left over. The trailing `completion` step is `finish` as a *phase* in
   * `utils/lesson-session.ts`'s state machine, not a step the walk indexes into -- see
   * `lessonSteps` below.
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

    // The competency-shaped lessons open with a dialogue set in a situation: the words
    // heard doing their job before any is held one at a time. Cultural notes sit before
    // the finish, and the TDA -- go and do this, this week -- on the finish screen.
    const placed = placeSections(contents)
    if (placed.dialogue) {
      const turns = dialogueTurns(placed.dialogue)
      if (turns.length > 0) {
        built.push({
          id: 'dialogue',
          type: 'dialogue',
          order: order++,
          title: getValue(placed.dialogue, 'title') || '',
          scene: getValue(placed.dialogue, 'content') || undefined,
          turns,
        })
      }
    }

    const answerable = (activities ?? []).filter(isAnswerable)
    const claimed = new Set<string>()

    const activityWord = (activity: { data: unknown }): string | undefined => {
      const data = (activity.data ?? {}) as { lexeme_id?: string; answer?: unknown; correct?: string }
      if (typeof data.lexeme_id === 'string') return data.lexeme_id
      if (typeof data.correct === 'string') return data.correct
      if (typeof data.answer === 'string') return data.answer
      return undefined
    }

    const teach = (word: LessonExample) => {
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
          wordKbp: word.kbp,
        })
      }
    }

    // Section by section: its words, each taught and tried, then the section's rule --
    // the prose the generator was asked to write, with the sentences that use those
    // words. Concrete before abstract: the learner has held taa and yɔɔ one at a time
    // before reading that place words follow the noun. Words no section claims (content
    // written before sections existed) are taught first, on their own.
    const prose = placed.prose
    for (const word of words) if (!sectionOf.has(word)) teach(word)
    prose.forEach((section, index) => {
      const own = words.filter((word) => sectionOf.get(word) === index)
      for (const word of own) teach(word)
      const rule = getValue(section, 'content')?.trim()
      if (rule) {
        built.push({
          id: `rule-${index}`,
          type: 'content',
          order: order++,
          title: getValue(section, 'title') || undefined,
          content: rule,
          examples: sectionSentences(
            section,
            own.map((word) => word.kbp)
          ),
        })
      }
    })

    // No word claimed these, so they carry no `wordKbp` -- answering one is not
    // practising a word, whatever the answer. See `utils/lesson-outcomes.ts`.
    for (const activity of answerable) {
      if (claimed.has(activity.id)) continue
      built.push({
        id: `activity-${activity.id}`,
        type: activity.activity_type as ActivityStep['type'],
        order: order++,
        activity,
      })
    }

    if (placed.notes) {
      built.push({
        id: 'notes',
        type: 'notes',
        order: order++,
        title: getValue(placed.notes, 'title') || '',
        content: getValue(placed.notes, 'content') || '',
      })
    }

    built.push({
      id: 'completion',
      type: 'completion',
      order: order++,
      tda: placed.tda ? getValue(placed.tda, 'content') || undefined : undefined,
    })
    return built
  }, [lesson, contents, activities, words, getValue])

  /** The fixed lesson `utils/lesson-session.ts` walks: cover through the last taught or
   *  practised step, excluding `completion` -- `finish` is a phase, not a step. */
  const lessonSteps = useMemo(() => steps.slice(0, -1), [steps])
  const completionStep = steps[steps.length - 1]

  // The session hydrates once, from the first non-empty step list it sees. Content can
  // arrive before activities, and a step list built from content alone has a different
  // fingerprint -- the stored session was judged stale and deleted, so resuming never
  // worked on a real network. Hand it the steps only once every query has settled.
  // Data present, not merely "done loading": a query that fails also stops loading, and
  // `activities ?? []` would then build a lesson with no exercises and save a session for it.
  const contentReady = lesson !== undefined && contents !== undefined && activities !== undefined
  const lessonSession = useLessonSession(lessonId, contentReady ? lessonSteps : NO_STEPS)
  const { session } = lessonSession

  /** Run a transition's effects: `addMet` (finishing the walk), `announceReview` (entering
   *  review), `markWritten` handled at the call site since it needs the effect's headword. */
  const applyEffects = (effects: Effect[]) => {
    for (const effect of effects) {
      if (effect.kind === 'addMet') {
        if (words.length > 0) {
          addMet(words.map((word) => ({ headword: word.kbp, lexemeId: word.lexeme_id })))
            .then((saved) => setSavedTotal(saved.length))
            .catch(() => {})
        }
      } else if (effect.kind === 'announceReview') {
        AccessibilityInfo.announceForAccessibility(t`Review. Words you missed, one more time.`)
      }
    }
  }

  const handleAdvance = () => {
    setShowWordOverlay(false)
    applyEffects(lessonSession.advance())
  }

  const handleAnswer = (isCorrect: boolean, answerText: string, step: LessonStep) => {
    const answerEffects = lessonSession.answer(step, answerText, isCorrect)
    for (const effect of answerEffects) {
      if (effect.kind === 'markWritten') void markWritten(effect.headword)
    }
    setShowWordOverlay(false)
    applyEffects(lessonSession.advance())
  }

  const handleClose = async () => {
    await lessonSession.flush()
    router.back()
  }

  const handleLessonComplete = async () => {
    // "Back to Lessons" used to record the lesson and stop there, leaving the learner
    // on the completion screen with no way out but the close button -- and every
    // further tap fired the mutation again. Record it, then actually go back.
    if (completeLessonMutation.isPending) return

    try {
      await completeLessonMutation.mutateAsync(lessonId)
      // The stored session's job ends here -- reopening this lesson starts fresh. A
      // failed removal is logged inside `clear()`; either way the learner still leaves.
      await lessonSession.clear()
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

  // Android's hardware back button closes the overlay rather than leaving the lesson --
  // it is showing an answer to a question still open underneath, not a screen of its own.
  useEffect(
    function closeOverlayOnHardwareBack() {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!showWordOverlay) return false
        setShowWordOverlay(false)
        return true
      })
      return () => subscription.remove()
    },
    [showWordOverlay]
  )

  // VoiceOver lands on the overlay's own heading the moment it opens, not wherever focus
  // happened to be on the question behind it. This has to run as an effect rather than
  // inline in the "Show the word again" press handler: the overlay (and the ref this
  // targets) does not exist in the native tree until the render it triggers has committed.
  useEffect(
    function focusOverlayHeading() {
      if (!showWordOverlay) return
      const handle = findNodeHandle(overlayHeadingRef.current)
      if (handle) AccessibilityInfo.setAccessibilityFocus(handle)
    },
    [showWordOverlay]
  )

  // Loading state
  if (lessonLoading || contentsLoading || activitiesLoading) {
    return (
      <View className="bg-background flex-1 px-6 pt-20">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="mt-10 h-12 w-4/5" />
        <Skeleton className="mt-4 h-6 w-2/3" />
        <SkeletonRows rows={3} />
      </View>
    )
  }

  // Not written yet, rather than broken. The direction's rule for an empty state is that
  // it names what still works: eighteen of the map's lessons are written, and that is a
  // fact about the curriculum a learner is entitled to before they plan around it.
  const isLessonAvailable = lesson ? isWritten(lesson.status) : false
  if (lesson && !isLessonAvailable) {
    const written = progressSummary?.totalLessons ?? 0
    const planned = progressSummary?.plannedLessons ?? written
    const isPending = lesson.status === 'coming_soon'

    return (
      <View className="bg-background flex-1 px-6 pt-16">
        <EmptyState
          glyph="ŋ"
          pending={isPending}
          title={
            isPending ? t`Not written yet.` : lesson.status === 'maintenance' ? t`Being corrected.` : t`Not available.`
          }
          body={
            written > 0
              ? t`${written} of ${planned} planned lessons have content. This one is on the list.`
              : t`This one is on the list.`
          }
          actions={[{ label: t`Back to path`, onPress: () => router.back(), primary: true }]}
        />
      </View>
    )
  }

  // Error state
  // A failed contents or activities fetch is a failed lesson, not a shorter one.
  if (lessonError || contentsError || activitiesError || !lesson) {
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

  // The lesson's own content is ready, but its saved session (if any) is not -- render the
  // same skeleton rather than a session that is about to be replaced by a restored one.
  if (!session) {
    return (
      <View className="bg-background flex-1 px-6 pt-20">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="mt-10 h-12 w-4/5" />
        <Skeleton className="mt-4 h-6 w-2/3" />
        <SkeletonRows rows={3} />
      </View>
    )
  }

  /** The step currently on screen: the lesson walk, or the frozen review walk (its step
   *  object carries `retry-{id}`, same as today), or the completion step at `finish`. */
  let currentStep: LessonStep | undefined
  if (session.phase === 'lesson') {
    currentStep = lessonSteps[session.lessonIndex]
  } else if (session.phase === 'review') {
    const originalId = session.reviewStepIds[session.reviewIndex]
    const original = lessonSteps.find((step) => step.id === originalId)
    currentStep = original ? ({ ...original, id: `retry-${originalId}` } as LessonStep) : undefined
  } else {
    currentStep = completionStep
  }

  if (!currentStep) {
    // `decode` should make this unreachable for a restored session; if it is reached anyway
    // the learner still needs a way out -- this screen has no progress bar or close button.
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Text variant="h6" className="text-primary text-center">
          {t`Lesson content will be available soon.`}
        </Text>
        <Button variant="outline" className="mt-6" onPress={() => router.back()}>
          {t`Back to path`}
        </Button>
      </View>
    )
  }
  // A `const` copy for the `onAnswer` closures below: `currentStep` is a `let`, so
  // TypeScript cannot carry its narrowing (nor its current value) into a callback that
  // might run after a later render reassigned it.
  const step: LessonStep = currentStep

  const view = computeProgressView(session, lessonSteps)
  const isReview = session.phase === 'review'

  // The first teach card in the walk that has no recording. It carries the one sentence
  // explaining the silence; every card after it is simply silent, which is the point.
  const firstSilentTeachIndex = lessonSteps.findIndex(
    (step) => step.type === 'teach' && usableAudioUrl(step.example.audio_url) === undefined
  )
  const currentLessonIndex = session.phase === 'lesson' ? session.lessonIndex : -1

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
              onContinue={handleAdvance}
            />
          )
        })()
      : null

  /**
   * Practised vs. merely met, for the finish screen -- the distinction the whole spec is
   * about. `lessonSteps`, not the retry walk: a retry's answer lives under `retry-{id}`,
   * and `practisedWords` already checks both forms against the original step.
   */
  const answeredMap = new Map(Object.entries(session.answers))
  const practisedSet = new Set(practisedWords(lessonSteps, answeredMap))
  const practised = words.filter((word) => practisedSet.has(word.kbp))
  const metOnly = words.filter((word) => !practisedSet.has(word.kbp))
  const review = reviewOutcomes(session, lessonSteps)

  // "Show the word again" only exists for a review item paired to a word -- nothing to
  // show again for a step nothing claimed.
  const currentWordKbp = hasActivity(currentStep) ? currentStep.wordKbp : undefined
  const overlayWord = currentWordKbp ? words.find((word) => word.kbp === currentWordKbp) : undefined
  const canShowWordAgain = isReview && overlayWord !== undefined

  // Render current step
  return (
    <View className="bg-background flex-1">
      {/* The frame takes the step's ground. Three steps are full-bleed -- the cover and
          the finish are laterite, Spot the letter is ink -- and a paper bar over them
          read as a strip of a different screen. */}
      <ProgressBar
        view={view}
        onClose={handleClose}
        tone={
          currentStep.type === 'cover' || currentStep.type === 'completion'
            ? 'accent'
            : currentStep.type === 'spot_letter'
              ? 'ink'
              : 'paper'
        }
      />

      {view.kind === 'review' && view.isStart ? (
        <View className="bg-background px-6 pb-1 pt-5">
          <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Review`}</Text>
          <Text className="text-foreground-secondary mt-1 text-[15px]">{t`Words you missed, one more time.`}</Text>
        </View>
      ) : null}

      {canShowWordAgain ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            lessonSession.showWord()
            setShowWordOverlay(true)
          }}
          // 44pt: the whole row is the target, not just the glyph height of its text --
          // see the search button in screens/home.tsx for why this is not `hitSlop`.
          className="min-h-[44px] flex-row items-center justify-center px-6"
        >
          <Text weight="semibold" className="text-accent-text text-[15px]">
            {t`Show the word again`}
          </Text>
        </Pressable>
      ) : null}

      {/* Step Content — keyed so each new step triggers the entering animation */}
      <View className="flex-1" style={{ position: 'relative' }}>
        <Animated.View
          key={currentStep.id}
          entering={currentStep.type === 'completion' ? FadeIn.duration(220) : FadeInRight.duration(260)}
          className="flex-1"
          // A live question sits behind the overlay while it is open -- VoiceOver must
          // not be able to reach it, and Android's TalkBack respects the same props.
          accessibilityElementsHidden={showWordOverlay}
          importantForAccessibility={showWordOverlay ? 'no-hide-descendants' : 'auto'}
        >
          {currentStep.type === 'cover' ? (
            <CoverStep
              title={getValue(lesson, 'title') || ''}
              description={getValue(lesson, 'description') || undefined}
              words={currentStep.words}
              onBegin={handleAdvance}
            />
          ) : null}

          {currentStep.type === 'teach' ? (
            <TeachStep
              example={currentStep.example}
              onContinue={handleAdvance}
              explainMissingAudio={currentLessonIndex === firstSilentTeachIndex}
            />
          ) : null}

          {currentStep.type === 'dialogue' ? (
            <DialogueStep
              title={currentStep.title}
              scene={currentStep.scene}
              turns={currentStep.turns}
              onContinue={handleAdvance}
            />
          ) : null}

          {currentStep.type === 'notes' ? (
            <ContentStep
              eyebrow={t`Culture`}
              title={currentStep.title}
              content={currentStep.content}
              onContinue={handleAdvance}
            />
          ) : null}

          {currentStep.type === 'content' ? (
            <ContentStep
              // The cover carries the lesson title; a rule step carries only its own.
              eyebrow={t`How it works`}
              title={currentStep.title}
              content={currentStep.content}
              examples={currentStep.examples}
              onContinue={handleAdvance}
            />
          ) : null}

          {audioStepContent}

          {currentStep.type === 'multiple_choice' || currentStep.type === 'true_false' ? (
            <QuizStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          ) : null}

          {currentStep.type === 'fill_blank' ? (
            <FillBlankStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          ) : null}

          {currentStep.type === 'listen_choose' && 'activity' in currentStep && (
            <ListenChooseStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          )}

          {currentStep.type === 'listen_type' && 'activity' in currentStep && (
            <ListenTypeStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          )}

          {currentStep.type === 'match_pairs' && 'activity' in currentStep && (
            <MatchPairsStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          )}

          {currentStep.type === 'order_words' && 'activity' in currentStep && (
            <OrderWordsStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          )}

          {currentStep.type === 'spell' && 'activity' in currentStep && (
            <SpellStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          )}

          {currentStep.type === 'spot_letter' && 'activity' in currentStep && (
            <SpotLetterStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          )}

          {currentStep.type === 'read_choose' && 'activity' in currentStep && (
            <ReadChooseStep
              activity={currentStep.activity}
              isReview={isReview}
              onAnswer={(isCorrect, answerText) => handleAnswer(isCorrect, answerText, step)}
            />
          )}

          {currentStep.type === 'completion' ? (
            <FinishStep
              practised={practised}
              metOnly={metOnly}
              review={review}
              tda={currentStep.tda}
              savedTotal={savedTotal}
              onDone={handleLessonComplete}
              isBusy={completeLessonMutation.isPending}
            />
          ) : null}
        </Animated.View>

        {showWordOverlay && overlayWord ? (
          <View
            className="bg-background"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            accessibilityViewIsModal
          >
            <View className="flex-1 px-6 pb-8 pt-8">
              <RNView ref={overlayHeadingRef} accessible accessibilityRole="header">
                <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">
                  {t`Show the word again`}
                </Text>
              </RNView>
              <View className="mt-4 flex-1">
                <TeachContent example={overlayWord} />
              </View>
              <Button variant="primary" fullWidth className="min-h-[44px]" onPress={() => setShowWordOverlay(false)}>
                {t`Back to the question`}
              </Button>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default LessonScreen
