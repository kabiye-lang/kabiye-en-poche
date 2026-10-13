import type { ActivityStep, LessonExample, LessonStep } from '../types/lesson-steps'
import type { LessonActivity, Tables } from '../types/supabase'

import { usableAudioUrl } from './audio-source'
import { spellingVariants } from './kabiye-variants'
import { kbpKey } from './kbp-key'
import { dialogueTurns, placeSections, sectionSentences } from './section-kinds'

type LessonContent = Tables<'lesson_contents'>
type GetValue = (obj: object | null | undefined, field: string) => string | null

const AUDIO_DEPENDENT_ACTIVITIES = new Set(['audio', 'listen_choose', 'listen_type'])

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
export const isAnswerable = (activity: { activity_type: string; data: unknown }): boolean => {
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
export function taughtWords(contents: LessonContent[] | undefined): {
  words: LessonExample[]
  sectionOf: Map<LessonExample, number>
} {
  const sectionOf = new Map<LessonExample, number>()
  if (!contents) return { words: [], sectionOf }
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
}

/** A small deterministic PRNG seeded from a string (djb2 into mulberry32). */
function seededRandom(seed: string): () => number {
  let state = 5381
  for (let i = 0; i < seed.length; i++) state = (state * 33 + seed.charCodeAt(i)) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Shuffled the same way every time for the same seed. The step list is fingerprinted to
 * resume a saved session (`fingerprintLesson` hashes activity data), so a random order
 * would make every saved session look stale.
 */
function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = seededRandom(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** Up to this many wrong options in a listening question built from the lesson's words. */
const LISTEN_DISTRACTORS = 3

/** Letters `ListenTypeStep`'s plain system keyboard can be relied on to type. */
const TYPABLE = /^[a-z]+$/

/**
 * A listening question for one taught word with a recording, built from the lesson's own
 * words: nothing is generated and nothing is written to the database.
 *
 * - `listen_choose`: the word and up to three other taught words, never two with the same
 *   spelling once tone is set aside (`kbpKey`) -- a listener cannot be asked to pick
 *   between forms the recording index itself treats as one. Needs two options at least.
 * - `listen_type`, only when a choice cannot be built (the lesson teaches one word) and
 *   the word is plain a–z. `ListenTypeStep` has no Kabiyè keyboard -- the letter tray
 *   lives in `SpellStep` -- so a word with ɛ, ɔ, ɩ, ʋ, ŋ, ɖ or ɣ cannot be typed there,
 *   and asking would only mark the learner wrong. Spelling is `spell`'s job, and only
 *   `spell` counts as evidence a word can be written.
 *
 * One listening question per word, at most: `teach()` pairs one generated activity to a
 * word, and this adds one more, so a lesson grows by one step per recorded word rather
 * than by two.
 */
function listeningActivity(
  word: LessonExample,
  audioUrl: string,
  words: readonly LessonExample[],
  lessonId: string
): LessonActivity | undefined {
  const key = kbpKey(word.kbp)
  const keys = new Set([key])
  const others: string[] = []
  for (const other of seededShuffle(words, `${lessonId}:${word.kbp}:others`)) {
    if (others.length >= LISTEN_DISTRACTORS) break
    const otherKey = kbpKey(other.kbp)
    if (!otherKey || keys.has(otherKey)) continue
    keys.add(otherKey)
    others.push(other.kbp)
  }

  const base = {
    lesson_id: lessonId,
    created_at: null,
    position: -1,
    question_en: null,
    question_fr: null,
    instructions_en: null,
    instructions_fr: null,
  }

  if (others.length >= 1) {
    return {
      ...base,
      id: `listen-choose-${word.kbp}`,
      activity_type: 'listen_choose',
      data: {
        audio_url: audioUrl,
        options: seededShuffle([word.kbp, ...others], `${lessonId}:${word.kbp}:options`),
        correct_answer: word.kbp,
      },
    }
  }

  if (TYPABLE.test(word.kbp.normalize('NFC').toLowerCase())) {
    return {
      ...base,
      id: `listen-type-${word.kbp}`,
      activity_type: 'listen_type',
      data: { audio_url: audioUrl, correct_answer: word.kbp },
    }
  }

  return undefined
}

/**
 * Steps, in the Laterite order: cover, then each word taught and immediately practised,
 * then whatever is left over. The trailing `completion` step is `finish` as a *phase* in
 * `utils/lesson-session.ts`'s state machine, not a step the walk indexes into -- see
 * `lessonSteps` in `screens/lesson.tsx`.
 *
 * The old order was every content section, then every activity -- a learner met `sɛtʋ`
 * in the middle of the second paragraph and was asked to spell it eleven screens later.
 * Pairing them is the whole point of the change.
 *
 * Activities are matched to a word by `lexeme_id` when the row carries one, and
 * otherwise by looking for the word in the activity's own data. Rows generated before
 * this change carry neither, so anything unmatched runs after the paired steps rather
 * than being dropped.
 *
 * `audioFor` returns a word's playable recording (already through `usableAudioUrl`). A
 * word with one gets a listening question after its paired activity -- see
 * `listeningActivity`. With no recordings the steps are exactly what they were before.
 */
export function buildLessonSteps({
  lessonId,
  contents,
  activities,
  words,
  sectionOf,
  getValue,
  audioFor,
}: {
  lessonId: string
  contents: LessonContent[]
  activities: LessonActivity[] | undefined
  words: LessonExample[]
  sectionOf: Map<LessonExample, number>
  getValue: GetValue
  audioFor: (word: LessonExample) => string | undefined
}): LessonStep[] {
  if (contents.length === 0) return []

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

    const audioUrl = audioFor(word)
    const listening = audioUrl ? listeningActivity(word, audioUrl, words, lessonId) : undefined
    if (listening && isAnswerable(listening)) {
      built.push({
        id: `activity-${listening.id}`,
        type: listening.activity_type as ActivityStep['type'],
        order: order++,
        activity: listening,
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
}
