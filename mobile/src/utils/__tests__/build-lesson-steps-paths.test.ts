import type { LearnerPath } from '../../hooks/use-path'
import type { ActivityStep, LessonExample, LessonStep } from '../../types/lesson-steps'
import type { LessonActivity, Tables } from '../../types/supabase'

import { buildLessonSteps, isAnswerable, taughtWords } from '../build-lesson-steps'
import { practisedWords } from '../lesson-outcomes'
import { fingerprintLesson } from '../lesson-session'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supabase: { url: 'https://isdeilllppdfngxmsols.supabase.co' } } } },
}))

// The path step order (docs/archive/SPEC-path-step-order.md), checked against a small
// oracle written from the spec on many seeded random lessons. The hand-picked tests in
// build-lesson-steps.test.ts pin one fixture; this one reaches the cases it does not:
// ties between two activities of the same rank, a listening question riding with a
// heritage step that moves, words no section claims (one group for the deferral), a
// section with no rule, unanswerable activities, and every path at once. Speaker also
// gains the app-built "spot the letter" steps of docs/specs/SPEC-speaker-spot-letter.md.

const HOSTED = 'https://isdeilllppdfngxmsols.supabase.co/storage/v1/object/public/audios/'

// Headwords already used by the builder tests (dictionary words); glosses and notes are
// English placeholders, not Kabiyè. Every random word carries a lexeme_id, as in all 192
// lesson files. A word without one matches any activity that names no word
// (`ref === word.lexeme_id` is `undefined === undefined`); the fixed case at the end of
// the test covers what the path does with that.
const HEADWORDS: { kbp: string; lexeme_id: string }[] = [
  { kbp: 'keɖe', lexeme_id: 'keɖe#1' },
  { kbp: 'tamaɣ', lexeme_id: 'tamaɣ#1' },
  { kbp: 'wɩʋ', lexeme_id: 'wɩʋ' },
  { kbp: 'luu', lexeme_id: 'luu' },
  { kbp: 'cee', lexeme_id: 'cee' },
  { kbp: 'caa', lexeme_id: 'caa' },
  { kbp: 'tɛɛ', lexeme_id: 'tɛɛ' },
]

const TYPES = [
  'spell',
  'spot_letter',
  'read_choose',
  'match_pairs',
  'multiple_choice',
  'fill_blank',
  'order_words',
  'true_false',
] as const

/** The Kabiyè-only letters, written out here rather than imported: the oracle is the spec. */
const SPECIAL = new Set([...'ɖɛɣɩŋɔʋñ', ...'ƉƐƔƖŊƆƲÑ'])

/** The spec's rank table. A type not listed is "Other": rank 1. */
const SPEC_RANK: Record<'speaker' | 'heritage', Record<string, number>> = {
  speaker: { spell: 0, spot_letter: 0 },
  heritage: {
    read_choose: 0,
    match_pairs: 0,
    multiple_choice: 0,
    spot_letter: 1,
    spell: 2,
    fill_blank: 2,
    order_words: 2,
  },
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const getValue = (obj: object | null | undefined, field: string) =>
  ((obj as Record<string, string> | null)?.[`${field}_en`] as string | undefined) ?? null

interface Case {
  contents: Tables<'lesson_contents'>[]
  activities: LessonActivity[]
  words: LessonExample[]
  sectionOf: Map<LessonExample, number>
  audioFor: (word: LessonExample) => string | undefined
}

function randomCase(seed: number): Case {
  const random = mulberry32(seed)
  const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)]
  const chance = (p: number) => random() < p

  const pool = [...HEADWORDS].sort(() => random() - 0.5).slice(0, 1 + Math.floor(random() * HEADWORDS.length))
  const sectionCount = 1 + Math.floor(random() * 3)
  const examples: LessonExample[][] = Array.from({ length: sectionCount }, () => [])
  for (const head of pool) {
    examples[Math.floor(random() * sectionCount)].push({ ...head, en: `gloss of ${head.kbp}`, note: { en: 'n' } })
  }

  const prose = examples.map((list, index): Tables<'lesson_contents'> => ({
    id: `c${index}`,
    lesson_id: 'L',
    kind: 'prose',
    position: index + 1,
    created_at: null,
    title_en: `Section ${index}`,
    title_fr: `Section ${index}`,
    // A section with no rule text gets no rule step; the deferral still ends there.
    content_en: chance(0.25) ? '' : `Rule ${index}`,
    content_fr: `Règle ${index}`,
    examples: list as unknown as Tables<'lesson_contents'>['examples'],
  }))
  const extra = (id: string, kind: string, position: number): Tables<'lesson_contents'> => ({
    ...prose[0],
    id,
    kind,
    position,
    title_en: id,
    content_en: `${id} text`,
    examples: (kind === 'dialogue'
      ? [{ kbp: 'caa', en: 'turn' }]
      : []) as unknown as Tables<'lesson_contents'>['examples'],
  })
  const contents = [
    ...(chance(0.5) ? [extra('dialogue', 'dialogue', 0)] : []),
    ...prose,
    ...(chance(0.5) ? [extra('notes', 'cultural_notes', 90)] : []),
    ...(chance(0.5) ? [extra('tda', 'tda', 91)] : []),
  ]

  const activities: LessonActivity[] = []
  const activityCount = Math.floor(random() * 12)
  for (let i = 0; i < activityCount; i++) {
    const type = pick(TYPES)
    const target = pick(HEADWORDS)
    const data: Record<string, unknown> = {}
    // How the builder finds an activity's word: lexeme_id, else correct, else answer.
    const how = pick(['lexeme_id', 'correct', 'answer', 'none'] as const)
    if (how === 'lexeme_id') data.lexeme_id = target.lexeme_id
    else if (how === 'correct') data.correct = target.kbp
    else if (how === 'answer') data.answer = target.kbp
    if (type === 'spot_letter') {
      data.correct = data.correct ?? target.kbp
      // Without distractors a word with one special letter or none is not answerable.
      if (chance(0.6)) data.distractors = ['x1', 'x2']
    }
    if (type === 'read_choose' && chance(0.8)) {
      data.sentence = target.kbp
      data.options = { en: ['a', 'b'] }
    }
    activities.push({
      id: `a${i}`,
      lesson_id: 'L',
      activity_type: type,
      data: data as LessonActivity['data'],
      position: i,
      created_at: null,
      question_en: null,
      question_fr: null,
      instructions_en: null,
      instructions_fr: null,
    })
  }

  const taught = taughtWords(contents)
  // Content written before sections existed: some words belong to no section and are
  // taught first, as one group.
  const sectionOf = new Map(taught.sectionOf)
  for (const word of taught.words) if (chance(0.2)) sectionOf.delete(word)

  const recorded = new Set(taught.words.filter(() => chance(0.4)).map((word) => word.kbp))
  const audioFor = (word: LessonExample) => (recorded.has(word.kbp) ? `${HOSTED}${word.kbp}.m4a` : undefined)

  return { contents, activities, words: taught.words, sectionOf, audioFor }
}

const build = (c: Case, path: LearnerPath | null) => buildLessonSteps({ lessonId: 'L', getValue, ...c, path })

const isListening = (step: LessonStep) => 'activity' in step && /^activity-listen-/.test(step.id)

/**
 * The order the spec asks for, as [id, wordKbp] pairs. The listening questions and the
 * content steps are taken from the `null` build: what is in the lesson never depends on
 * the path, only where it sits. Speaker adds its built steps on top: up to 3, for taught
 * words with 2 or more Kabiyè-only letters and no spell or spot_letter paired, most such
 * letters first, each right after its word's Teach card. (Two such letters always give
 * two misspellings, so every one is answerable.)
 */
function oracle(c: Case, path: LearnerPath | null): [string, string | null][] {
  const reference = build(c, null)
  const listeningOf = (kbp: string) => reference.filter((s) => isListening(s) && (s as ActivityStep).wordKbp === kbp)
  const ranks = path === 'speaker' || path === 'heritage' ? SPEC_RANK[path] : undefined
  const rank = (a: LessonActivity) => ranks?.[a.activity_type] ?? 1
  const ref = (a: LessonActivity) => {
    const d = (a.data ?? {}) as Record<string, unknown>
    for (const key of ['lexeme_id', 'correct', 'answer']) if (typeof d[key] === 'string') return d[key] as string
    return undefined
  }

  const answerable = c.activities.filter(isAnswerable)
  const claimed = new Set<string>()
  const taught: { kbp: string; pairedType?: string }[] = []
  const out: [string, string | null][] = reference
    .filter((s) => s.type === 'cover' || s.type === 'dialogue')
    .map((s) => [s.id, null])

  const group = (words: LessonExample[]) => {
    const later: [string, string | null][] = []
    for (const word of words) {
      out.push([`teach-${word.kbp}`, null])
      const candidates = answerable
        .map((a, index) => ({ a, index }))
        .filter(({ a }) => !claimed.has(a.id) && (ref(a) === word.kbp || ref(a) === word.lexeme_id))
        // Lowest rank first; a tie keeps list order.
        .sort((x, y) => rank(x.a) - rank(y.a) || x.index - y.index)
      const paired = candidates[0]?.a
      taught.push({ kbp: word.kbp, pairedType: paired?.activity_type })
      const practice: [string, string | null][] = []
      if (paired) {
        claimed.add(paired.id)
        practice.push([`activity-${paired.id}`, word.kbp])
      }
      for (const s of listeningOf(word.kbp)) practice.push([s.id, word.kbp])
      if (path === 'heritage' && paired && rank(paired) === 2) later.push(...practice)
      else out.push(...practice)
    }
    out.push(...later)
  }

  group(c.words.filter((word) => !c.sectionOf.has(word)))
  const prose = c.contents.filter((s) => !['dialogue', 'cultural_notes', 'tda'].includes(s.kind ?? ''))
  prose.forEach((section, index) => {
    group(c.words.filter((word) => c.sectionOf.get(word) === index))
    if (section.content_en?.trim()) out.push([`rule-${index}`, null])
  })

  const unclaimed = answerable
    .map((a, index) => ({ a, index }))
    .filter(({ a }) => !claimed.has(a.id))
    .sort((x, y) => (ranks ? rank(x.a) - rank(y.a) : 0) || x.index - y.index)
  for (const { a } of unclaimed) out.push([`activity-${a.id}`, null])

  for (const s of reference) if (s.type === 'notes' || s.type === 'completion') out.push([s.id, null])

  if (path === 'speaker') {
    const special = (kbp: string) => [...kbp].filter((ch) => SPECIAL.has(ch)).length
    const chosen = taught
      .map((t, index) => ({ ...t, index }))
      .filter((t) => special(t.kbp) >= 2 && t.pairedType !== 'spell' && t.pairedType !== 'spot_letter')
      .sort((x, y) => special(y.kbp) - special(x.kbp) || x.index - y.index)
      .slice(0, 3)
    for (const { kbp } of chosen) {
      const at = out.findIndex(([id]) => id === `teach-${kbp}`)
      out.splice(at + 1, 0, [`built-spot-${kbp}`, kbp])
    }
  }
  return out
}

const shape = (steps: LessonStep[]): [string, string | null][] =>
  steps.map((s) => [s.id, 'wordKbp' in s ? ((s as ActivityStep).wordKbp ?? null) : null])

const PATHS: (LearnerPath | null)[] = [null, 'new', 'speaker', 'heritage']
const SEEDS = Array.from({ length: 400 }, (_, i) => i + 1)

describe('buildLessonSteps by path, against the spec on random lessons', () => {
  it('orders every step as the spec says, and keeps the same steps and practised words, on every path', () => {
    const mismatches: string[] = []
    let heritageMoves = 0
    let movedListening = 0
    let ties = 0
    let builtSteps = 0
    for (const seed of SEEDS) {
      const c = randomCase(seed)
      const built = PATHS.map((path) => build(c, path))
      built.forEach((steps, p) => {
        const expected = oracle(c, PATHS[p])
        if (JSON.stringify(shape(steps)) !== JSON.stringify(expected)) {
          mismatches.push(
            `seed ${seed} path ${PATHS[p]}:\n  got  ${JSON.stringify(shape(steps))}\n  want ${JSON.stringify(expected)}`
          )
        }
        steps.forEach((s, i) => {
          if (s.order !== i) mismatches.push(`seed ${seed} path ${PATHS[p]}: step ${s.id} has order ${s.order} at ${i}`)
        })
      })

      // null and 'new' are one order and one fingerprint; every path holds the same steps,
      // once speaker's built ones are set aside. No other path has any.
      const ids = built.map((steps) => steps.map((s) => s.id))
      expect(JSON.stringify(ids[1])).toBe(JSON.stringify(ids[0]))
      expect(fingerprintLesson(built[1].slice(0, -1))).toBe(fingerprintLesson(built[0].slice(0, -1)))
      const authored = built.map((steps) => steps.filter((s) => !(s as ActivityStep).built).map((s) => s.id))
      for (const list of authored) expect([...list].sort()).toEqual([...ids[0]].sort())
      built.forEach((steps, p) => {
        const count = steps.filter((s) => (s as ActivityStep).built).length
        if (PATHS[p] === 'speaker') builtSteps += count
        else expect(count).toBe(0)
      })

      // A learner who answers every question practises the same words, whatever the path:
      // the path changes which activity a word is paired to, never whether it has one.
      const practised = built.map((steps) => practisedWords(steps, new Map(steps.map((s) => [s.id, 'answer']))).sort())
      for (const words of practised) expect(words).toEqual(practised[0])

      // A paired step always names the word it is paired to, never a neighbour.
      for (const steps of built) {
        for (const s of steps) {
          if (!('activity' in s) || !(s as ActivityStep).wordKbp || isListening(s)) continue
          const step = s as ActivityStep
          const word = c.words.find((w) => w.kbp === step.wordKbp)!
          const data = (step.activity.data ?? {}) as Record<string, unknown>
          const named = ['lexeme_id', 'correct', 'answer'].map((key) => data[key]).find((v) => typeof v === 'string')
          expect([word.kbp, word.lexeme_id]).toContain(named)
        }
      }

      // Count what the seeds reach, so a generator change that stops reaching it fails.
      const heritage = shape(built[3])
      if (JSON.stringify(heritage) !== JSON.stringify(shape(built[0]))) heritageMoves++
      heritage.forEach(([id, kbp], i) => {
        if (
          /^activity-listen-/.test(id) &&
          heritage[i - 1]?.[0].startsWith('activity-') &&
          heritage[i - 1][1] === kbp
        ) {
          const pairedId = heritage[i - 1][0]
          const pairedType = c.activities.find((a) => `activity-${a.id}` === pairedId)?.activity_type
          if (pairedType && SPEC_RANK.heritage[pairedType] === 2) movedListening++
        }
      })
      for (const word of c.words) {
        const sameRank = c.activities
          .filter(isAnswerable)
          .filter((a) => Object.values((a.data ?? {}) as object).some((v) => v === word.kbp || v === word.lexeme_id))
          .filter((a) => (SPEC_RANK.speaker[a.activity_type] ?? 1) === 0)
        if (sameRank.length >= 2) ties++
      }
    }
    expect(mismatches.slice(0, 5)).toEqual([])
    expect(heritageMoves).toBeGreaterThan(50)
    expect(movedListening).toBeGreaterThan(10)
    expect(ties).toBeGreaterThan(10)
    expect(builtSteps).toBeGreaterThan(50)

    // A word with no lexeme_id, and an activity that names no word. Today (null) tɛɛ is
    // paired to the fill_blank that names it. A path must not trade that for the spell that
    // names nothing: the practised words would then differ by path, and tɛɛ would count as
    // practised through a question that is not about it.
    const loose: Case = (() => {
      const contents: Tables<'lesson_contents'>[] = [
        {
          id: 'c0',
          lesson_id: 'L',
          kind: 'prose',
          position: 0,
          created_at: null,
          title_en: 'Section 0',
          title_fr: 'Section 0',
          content_en: 'Rule 0',
          content_fr: 'Règle 0',
          examples: [
            { kbp: 'tɛɛ', en: 'gloss of tɛɛ', note: { en: 'n' } },
            { kbp: 'caa', en: 'gloss of caa', note: { en: 'n' } },
          ] as unknown as Tables<'lesson_contents'>['examples'],
        },
      ]
      const activity = (id: string, activity_type: string, data: Record<string, unknown>): LessonActivity => ({
        id,
        lesson_id: 'L',
        activity_type,
        data: data as LessonActivity['data'],
        position: 0,
        created_at: null,
        question_en: null,
        question_fr: null,
        instructions_en: null,
        instructions_fr: null,
      })
      const { words, sectionOf } = taughtWords(contents)
      return {
        contents,
        activities: [activity('a0', 'fill_blank', { answer: 'tɛɛ' }), activity('a1', 'spell', {})],
        words,
        sectionOf,
        audioFor: () => undefined,
      }
    })()
    const looseBuilt = PATHS.map((path) => build(loose, path))
    const pairedTo = (steps: LessonStep[], kbp: string) =>
      steps.find((s) => 'activity' in s && !(s as ActivityStep).built && (s as ActivityStep).wordKbp === kbp)?.id
    expect(pairedTo(looseBuilt[0], 'tɛɛ')).toBe('activity-a0')
    for (const steps of looseBuilt) expect(pairedTo(steps, 'tɛɛ')).toBe('activity-a0')
    const loosePractised = looseBuilt.map((steps) =>
      practisedWords(steps, new Map(steps.map((s) => [s.id, 'answer']))).sort()
    )
    for (const words of loosePractised) expect(words).toEqual(loosePractised[0])
  })
})
