import type { InputProps } from 'ra-core'

import { useCallback, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { useInput } from 'ra-core'

import { AudioUrlField } from '@/components/audio-url-field'
import { FormError } from '@/components/form-error'
import { Input } from '@/components/ui/input'

type ActivityType =
  | 'audio'
  | 'listen_choose'
  | 'listen_type'
  | 'match_pairs'
  | 'order_words'
  | 'fill_blank'
  | 'multiple_choice'
  | 'spell'
  | 'spot_letter'
  | 'read_choose'
  | 'true_false'

type ActivityData = Record<string, unknown>

/** The letters a French keyboard cannot reach — what `spot_letter` swaps out. */
const KABIYE_ONLY = 'ɖƉɛƐɣƔɩƖŋŊɔƆʋƲñÑ'

/** How many of those a word carries. */
export function specialCount(word: string): number {
  return [...word].filter((letter) => KABIYE_ONLY.includes(letter)).length
}

/**
 * Read a localised field written either way.
 *
 * Two conventions coexist in `lesson_activities.data`: flat `gloss_en` / `gloss_fr`,
 * which is what the importer writes and what every existing row uses, and nested
 * `gloss: {en, fr}`, which is what the generator emits. A form that reads only the
 * nested form shows a required field as empty and wipes it the moment anyone saves --
 * which is exactly what this one did to every `spot_letter` gloss in the database.
 */
function readLocalised(data: ActivityData, field: string, lang: 'en' | 'fr'): string {
  const flat = data[`${field}_${lang}`]
  if (typeof flat === 'string') return flat

  const nested = data[field]
  if (nested && typeof nested === 'object') {
    const value = (nested as Record<string, unknown>)[lang]
    if (typeof value === 'string') return value
  }
  return ''
}

/**
 * Write the nested form, and drop the flat one.
 *
 * Leaving `gloss_en` behind next to a new `gloss: {en}` would be worse than not editing
 * at all: the app prefers whichever it finds first, so the edit would look saved and
 * have no effect.
 */
function writeLocalised(data: ActivityData, field: string, lang: 'en' | 'fr', value: string): ActivityData {
  const existing = (data[field] ?? {}) as Record<string, string>
  const merged: ActivityData = {
    ...data,
    [field]: {
      en: lang === 'en' ? value : (existing.en ?? readLocalised(data, field, 'en')),
      fr: lang === 'fr' ? value : (existing.fr ?? readLocalised(data, field, 'fr')),
    },
  }
  delete merged[`${field}_en`]
  delete merged[`${field}_fr`]
  return merged
}

/** Validates activity data based on type. Returns error message or undefined. */
export function validateActivityData(value: unknown, values?: { activity_type?: string }): string | undefined {
  const data = (value ?? {}) as ActivityData
  const type = values?.activity_type

  if (!type) return undefined

  switch (type) {
    case 'audio':
      if (!data.audioUrl && !data.audio_url) return 'Audio URL is required'
      break
    case 'listen_choose':
      if (!data.audio_url) return 'Audio URL is required'
      if (!Array.isArray(data.options) || data.options.length === 0) return 'At least one option is required'
      if (!data.correct_answer) return 'Correct answer is required (must match an option exactly)'
      break
    case 'listen_type':
      if (!data.audio_url) return 'Audio URL is required'
      if (!data.correct_answer) return 'Correct answer is required'
      break
    case 'match_pairs':
      if (!Array.isArray(data.pairs) || data.pairs.length === 0) return 'At least one pair is required'
      break
    case 'order_words':
      if (!Array.isArray(data.words) || data.words.length === 0) return 'Words array is required'
      if (!Array.isArray(data.correct_order) || data.correct_order.length === 0) return 'Correct order is required'
      break
    case 'fill_blank':
      if (!data.answer) return 'Answer is required'
      if (!Array.isArray(data.options) || data.options.length === 0) return 'At least one option is required'
      if (!data.sentence_en && !data.sentence_fr && !(data.sentence as Record<string, string>)?.en)
        return 'Sentence (EN or FR) is required. Use ___ for the blank.'
      break
    case 'multiple_choice':
      // At least one set of options and matching correct_answer
      const opts = data.options as Record<string, string[]>
      const correct = data.correct_answer as Record<string, string>
      if (!opts || typeof opts !== 'object') return 'Options are required (kbp, en, or fr)'
      const hasOpts = (opts.kbp?.length ?? 0) > 0 || (opts.en?.length ?? 0) > 0 || (opts.fr?.length ?? 0) > 0
      if (!hasOpts) return 'At least one set of options is required'
      if (!correct || typeof correct !== 'object') return 'Correct answer is required'
      break
    case 'spell':
      if (!data.answer) return 'The Kabiyè spelling is required'
      if (!readLocalised(data, 'gloss', 'en') && !readLocalised(data, 'gloss', 'fr'))
        return 'A gloss (EN or FR) is required — it is the prompt the learner spells from'
      break
    case 'spot_letter': {
      const correct = (data.correct ?? '') as string
      if (!correct) return 'The correct spelling is required'
      // The wrong spellings are derived by the app, never authored. One Kabiyè letter
      // yields one distractor, which makes the question a two-option coin flip.
      if (specialCount(correct) < 2)
        return 'The word needs at least two of ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ, or there is only one wrong spelling to offer'
      if (!readLocalised(data, 'gloss', 'en') && !readLocalised(data, 'gloss', 'fr'))
        return 'A gloss (EN or FR) is required'
      break
    }
    case 'read_choose': {
      if (!data.sentence) return 'The Kabiyè sentence is required'
      const readings = data.options as Record<string, string[]>
      const hasReadings = (readings?.en?.length ?? 0) > 0 || (readings?.fr?.length ?? 0) > 0
      if (!hasReadings) return 'At least one set of readings (EN or FR) is required'
      if (!data.correct_answer) return 'Correct answer is required (must match a reading exactly)'
      break
    }
    case 'true_false':
      if (data.answer !== true && data.answer !== false) return 'Correct answer (true or false) is required'
      break
  }
  return undefined
}

/** Renders a list of string inputs with add/remove */
function StringArrayField({
  value = [],
  onChange,
  label,
  placeholder = 'Add item',
}: {
  value: string[]
  onChange: (v: string[]) => void
  label: string
  placeholder?: string
}) {
  const handleChange = (idx: number, v: string) => {
    const next = [...value]
    next[idx] = v
    onChange(next)
  }
  const add = () => onChange([...value, ''])
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <button type="button" onClick={add} className="text-primary text-sm hover:underline">
          + Add
        </button>
      </div>
      {value.map((item, idx) => (
        <div key={idx} className="flex gap-2">
          <Input
            value={item}
            onChange={(e) => handleChange(idx, e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="rounded border px-2 text-sm text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

/** Match pair: en, fr, kbp */
function MatchPairField({
  value,
  onChange,
  onRemove,
}: {
  value: { en?: string; fr?: string; kbp?: string }
  onChange: (v: { en?: string; fr?: string; kbp?: string }) => void
  onRemove: () => void
}) {
  return (
    <div className="border-input flex flex-wrap gap-2 rounded border p-2">
      <Input
        placeholder="English"
        value={value.en ?? ''}
        onChange={(e) => onChange({ ...value, en: e.target.value })}
        className="min-w-24 flex-1"
      />
      <Input
        placeholder="French"
        value={value.fr ?? ''}
        onChange={(e) => onChange({ ...value, fr: e.target.value })}
        className="min-w-24 flex-1"
      />
      <Input
        placeholder="Kabiyè"
        value={value.kbp ?? ''}
        onChange={(e) => onChange({ ...value, kbp: e.target.value })}
        className="min-w-24 flex-1"
      />
      <button type="button" onClick={onRemove} className="rounded border px-2 text-sm text-red-600 hover:bg-red-50">
        Remove
      </button>
    </div>
  )
}

function AudioFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <div>
        <AudioUrlField
          label="Audio URL"
          value={(data.audioUrl ?? data.audio_url ?? '') as string}
          onChange={(v) => upd('audioUrl', v)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Type</label>
        <select
          value={(data.audioType ?? 'single') as string}
          onChange={(e) => upd('audioType', e.target.value)}
          className="border-input w-full rounded-md border px-3 py-2"
        >
          <option value="single">Single</option>
          <option value="conversation">Conversation</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Transcript (EN)</label>
        <textarea
          value={(data.transcript_en ?? data.transcript ?? '') as string}
          onChange={(e) => upd('transcript_en', e.target.value)}
          placeholder="English transcript"
          className="border-input w-full rounded-md border px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Transcript (FR)</label>
        <textarea
          value={(data.transcript_fr ?? '') as string}
          onChange={(e) => upd('transcript_fr', e.target.value)}
          placeholder="French transcript"
          className="border-input w-full rounded-md border px-3 py-2"
          rows={3}
        />
      </div>
    </div>
  )
}

function ListenChooseFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  const options = (data.options ?? []) as string[]
  return (
    <div className="space-y-4">
      <div>
        <AudioUrlField
          label="Audio URL *"
          value={(data.audio_url ?? '') as string}
          onChange={(v) => upd('audio_url', v)}
        />
      </div>
      <StringArrayField
        value={options}
        onChange={(v) => upd('options', v)}
        label="Options *"
        placeholder="Option text"
      />
      <div>
        <label className="text-sm font-medium">Correct answer *</label>
        <Input
          value={(data.correct_answer ?? '') as string}
          onChange={(e) => upd('correct_answer', e.target.value)}
          placeholder="Must match one option exactly"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Translation (EN)</label>
        <Input
          value={(data.translation_en ?? (data.translation as Record<string, string>)?.en ?? '') as string}
          onChange={(e) => upd('translation_en', e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Translation (FR)</label>
        <Input
          value={(data.translation_fr ?? (data.translation as Record<string, string>)?.fr ?? '') as string}
          onChange={(e) => upd('translation_fr', e.target.value)}
        />
      </div>
    </div>
  )
}

function ListenTypeFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  const hints = (data.hints ?? []) as string[]
  return (
    <div className="space-y-4">
      <div>
        <AudioUrlField
          label="Audio URL *"
          value={(data.audio_url ?? '') as string}
          onChange={(v) => upd('audio_url', v)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Correct answer *</label>
        <Input
          value={(data.correct_answer ?? '') as string}
          onChange={(e) => upd('correct_answer', e.target.value)}
          placeholder="Expected Kabiyè response"
        />
      </div>
      <StringArrayField
        value={hints}
        onChange={(v) => upd('hints', v)}
        label="Hints"
        placeholder="Hint for the learner"
      />
      <div>
        <label className="text-sm font-medium">Translation (EN)</label>
        <Input
          value={(data.translation_en ?? (data.translation as Record<string, string>)?.en ?? '') as string}
          onChange={(e) => upd('translation_en', e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Translation (FR)</label>
        <Input
          value={(data.translation_fr ?? (data.translation as Record<string, string>)?.fr ?? '') as string}
          onChange={(e) => upd('translation_fr', e.target.value)}
        />
      </div>
    </div>
  )
}

function MatchPairsFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const pairs = (data.pairs ?? []) as Array<{ en?: string; fr?: string; kbp?: string }>
  const upd = (next: Array<{ en?: string; fr?: string; kbp?: string }>) => onChange({ ...data, pairs: next })
  const handleChange = (idx: number, v: { en?: string; fr?: string; kbp?: string }) => {
    const next = [...pairs]
    next[idx] = v
    upd(next)
  }
  const add = () => upd([...pairs, { en: '', fr: '', kbp: '' }])
  const remove = (idx: number) => upd(pairs.filter((_, i) => i !== idx))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Pairs (en, fr, kbp) *</label>
        <button type="button" onClick={add} className="text-primary text-sm hover:underline">
          + Add pair
        </button>
      </div>
      {pairs.map((p, idx) => (
        <MatchPairField key={idx} value={p} onChange={(v) => handleChange(idx, v)} onRemove={() => remove(idx)} />
      ))}
    </div>
  )
}

function OrderWordsFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  const words = (data.words ?? []) as string[]
  const correct_order = (data.correct_order ?? []) as string[]
  return (
    <div className="space-y-4">
      <StringArrayField value={words} onChange={(v) => upd('words', v)} label="Words (shuffled) *" placeholder="Word" />
      <StringArrayField
        value={correct_order}
        onChange={(v) => upd('correct_order', v)}
        label="Correct order *"
        placeholder="Word in order"
      />
    </div>
  )
}

function FillBlankFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  const options = (data.options ?? []) as string[]
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Answer *</label>
        <Input
          value={(data.answer ?? '') as string}
          onChange={(e) => upd('answer', e.target.value)}
          placeholder="Correct word for the blank"
        />
      </div>
      <StringArrayField
        value={options}
        onChange={(v) => upd('options', v)}
        label="Options *"
        placeholder="Choice for the blank"
      />
      <div>
        <label className="text-sm font-medium">Sentence (EN) *</label>
        <Input
          value={(data.sentence_en ?? (data.sentence as Record<string, string>)?.en ?? '') as string}
          onChange={(e) => upd('sentence_en', e.target.value)}
          placeholder="Use ___ for the blank"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Sentence (FR) *</label>
        <Input
          value={(data.sentence_fr ?? (data.sentence as Record<string, string>)?.fr ?? '') as string}
          onChange={(e) => upd('sentence_fr', e.target.value)}
          placeholder="Use ___ for the blank"
        />
      </div>
    </div>
  )
}

function MultipleChoiceFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const opts = (data.options ?? {}) as Record<string, string[]>
  const correct = (data.correct_answer ?? {}) as Record<string, string>

  const updOpts = (lang: string, v: string[]) => onChange({ ...data, options: { ...opts, [lang]: v } })
  const updCorrect = (lang: string, v: string) => onChange({ ...data, correct_answer: { ...correct, [lang]: v } })

  return (
    <div className="space-y-4">
      <div>
        <StringArrayField
          value={opts.kbp ?? []}
          onChange={(v) => updOpts('kbp', v)}
          label="Options (Kabiyè)"
          placeholder="Kabiyè option"
        />
      </div>
      <div>
        <StringArrayField
          value={opts.en ?? []}
          onChange={(v) => updOpts('en', v)}
          label="Options (EN)"
          placeholder="English option"
        />
      </div>
      <div>
        <StringArrayField
          value={opts.fr ?? []}
          onChange={(v) => updOpts('fr', v)}
          label="Options (FR)"
          placeholder="French option"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Correct answer (Kabiyè)</label>
        <Input
          value={correct.kbp ?? ''}
          onChange={(e) => updCorrect('kbp', e.target.value)}
          placeholder="Correct Kabiyè option"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Correct answer (EN)</label>
        <Input
          value={correct.en ?? ''}
          onChange={(e) => updCorrect('en', e.target.value)}
          placeholder="Correct English option"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Correct answer (FR)</label>
        <Input
          value={correct.fr ?? ''}
          onChange={(e) => updCorrect('fr', e.target.value)}
          placeholder="Correct French option"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Explanation (EN)</label>
        <textarea
          value={readLocalised(data, 'explanation', 'en')}
          onChange={(e) => onChange(writeLocalised(data, 'explanation', 'en', e.target.value))}
          placeholder="Why this answer is correct"
          className="border-input w-full rounded-md border px-3 py-2"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Explanation (FR)</label>
        <textarea
          value={readLocalised(data, 'explanation', 'fr')}
          onChange={(e) => onChange(writeLocalised(data, 'explanation', 'fr', e.target.value))}
          placeholder="Why this answer is correct"
          className="border-input w-full rounded-md border px-3 py-2"
          rows={2}
        />
      </div>
    </div>
  )
}

function TrueFalseFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Correct answer (true/false)</label>
        <select
          value={String(data.answer ?? '')}
          onChange={(e) => upd('answer', e.target.value === 'true')}
          className="border-input w-full rounded-md border px-3 py-2"
        >
          <option value="">—</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Explanation (EN)</label>
        <textarea
          value={readLocalised(data, 'explanation', 'en')}
          onChange={(e) => onChange(writeLocalised(data, 'explanation', 'en', e.target.value))}
          className="border-input w-full rounded-md border px-3 py-2"
          rows={2}
        />
      </div>
      <div>
        <label className="text-sm font-medium">Explanation (FR)</label>
        <textarea
          value={readLocalised(data, 'explanation', 'fr')}
          onChange={(e) => onChange(writeLocalised(data, 'explanation', 'fr', e.target.value))}
          className="border-input w-full rounded-md border px-3 py-2"
          rows={2}
        />
      </div>
    </div>
  )
}

function SpellFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  const updLocalised = (field: string, lang: 'en' | 'fr', v: string) =>
    onChange(writeLocalised(data, field, lang, v))

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Kabiyè spelling *</label>
        <Input
          value={(data.answer ?? '') as string}
          onChange={(e) => upd('answer', e.target.value)}
          placeholder="The attested spelling the learner types"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Gloss (EN) *</label>
          <Input value={readLocalised(data, 'gloss', 'en')} onChange={(e) => updLocalised('gloss', 'en', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Gloss (FR) *</label>
          <Input value={readLocalised(data, 'gloss', 'fr')} onChange={(e) => updLocalised('gloss', 'fr', e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Hint (EN)</label>
          <Input value={readLocalised(data, 'hint', 'en')} onChange={(e) => updLocalised('hint', 'en', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Hint (FR)</label>
          <Input value={readLocalised(data, 'hint', 'fr')} onChange={(e) => updLocalised('hint', 'fr', e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function SpotLetterFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  const updLocalised = (field: string, lang: 'en' | 'fr', v: string) =>
    onChange(writeLocalised(data, field, lang, v))
  const correct = (data.correct ?? '') as string
  const specials = specialCount(correct)

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Correct spelling *</label>
        <Input
          value={correct}
          onChange={(e) => upd('correct', e.target.value)}
          placeholder="e.g. Kabɩyɛ"
        />
        {/* The count is shown as you type because the rule is invisible otherwise: the
            wrong spellings never appear in this form, so nothing else on screen says
            why a one-special word is unusable. */}
        <p className={specials >= 2 ? 'text-muted-foreground mt-1 text-sm' : 'mt-1 text-sm text-red-600'}>
          {specials} of ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ. Two or more are needed — the wrong spellings are derived by swapping each
          for the plain letter a French keyboard reaches for, so one letter means one distractor.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Gloss (EN) *</label>
          <Input value={readLocalised(data, 'gloss', 'en')} onChange={(e) => updLocalised('gloss', 'en', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Gloss (FR) *</label>
          <Input value={readLocalised(data, 'gloss', 'fr')} onChange={(e) => updLocalised('gloss', 'fr', e.target.value)} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Explanation (EN)</label>
          <textarea
            value={readLocalised(data, 'explanation', 'en')}
            onChange={(e) => updLocalised('explanation', 'en', e.target.value)}
            className="border-input w-full rounded-md border px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Explanation (FR)</label>
          <textarea
            value={readLocalised(data, 'explanation', 'fr')}
            onChange={(e) => updLocalised('explanation', 'fr', e.target.value)}
            className="border-input w-full rounded-md border px-3 py-2"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * The correct answer as text, whichever way the row stores it.
 *
 * Older rows keep `{en, fr}`; the schema now says a plain string. An `<Input>` handed an
 * object renders "[object Object]" and saves that literal string over the real answer,
 * which is what this field was doing to every `read_choose` in the database. The app
 * matches the answer by position across the language lists, so either shape works
 * on the way out — but only a string is safe to edit here.
 */
function answerText(data: ActivityData): string {
  const answer = data.correct_answer
  if (typeof answer === 'string') return answer
  if (answer && typeof answer === 'object') {
    const byLanguage = answer as Record<string, unknown>
    for (const key of ['en', 'fr', 'kbp']) {
      if (typeof byLanguage[key] === 'string') return byLanguage[key] as string
    }
  }
  return ''
}

function ReadChooseFields({ data, onChange }: { data: ActivityData; onChange: (d: ActivityData) => void }) {
  const upd = (k: string, v: unknown) => onChange({ ...data, [k]: v })
  const updLocalised = (field: string, lang: 'en' | 'fr', v: string) =>
    onChange(writeLocalised(data, field, lang, v))
  const options = (data.options ?? {}) as Record<string, string[]>

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Kabiyè sentence *</label>
        <Input
          value={(data.sentence ?? '') as string}
          onChange={(e) => upd('sentence', e.target.value)}
          placeholder="The sentence the learner reads"
        />
      </div>
      <StringArrayField
        value={options.en ?? []}
        onChange={(v) => upd('options', { ...options, en: v })}
        label="Readings (EN)"
        placeholder="A possible reading"
      />
      <StringArrayField
        value={options.fr ?? []}
        onChange={(v) => upd('options', { ...options, fr: v })}
        label="Readings (FR)"
        placeholder="Une lecture possible"
      />
      <div>
        <label className="text-sm font-medium">Correct answer *</label>
        <Input
          value={answerText(data)}
          onChange={(e) => upd('correct_answer', e.target.value)}
          placeholder="Must match one reading exactly, in either language"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Explanation (EN)</label>
          <textarea
            value={readLocalised(data, 'explanation', 'en')}
            onChange={(e) => updLocalised('explanation', 'en', e.target.value)}
            className="border-input w-full rounded-md border px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Explanation (FR)</label>
          <textarea
            value={readLocalised(data, 'explanation', 'fr')}
            onChange={(e) => updLocalised('explanation', 'fr', e.target.value)}
            className="border-input w-full rounded-md border px-3 py-2"
            rows={2}
          />
        </div>
      </div>
    </div>
  )
}

export function ActivityDataFormInput(props: InputProps) {
  const { field, fieldState } = useInput(props)
  const { watch } = useFormContext()
  const activityType = watch('activity_type') as ActivityType | undefined

  const [local, setLocal] = useState<ActivityData>(() =>
    typeof field.value === 'object' && field.value !== null ? (field.value as ActivityData) : {}
  )

  useEffect(() => {
    if (typeof field.value === 'object' && field.value !== null) {
      setLocal(field.value as ActivityData)
    } else {
      setLocal({})
    }
  }, [field.value])

  const handleChange = useCallback(
    (next: ActivityData) => {
      setLocal(next)
      field.onChange(next)
    },
    [field]
  )

  if (!activityType) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-4">
        <p className="text-sm">Select an activity type above to edit the data.</p>
      </div>
    )
  }

  let content: React.ReactNode
  switch (activityType) {
    case 'audio':
      content = <AudioFields data={local} onChange={handleChange} />
      break
    case 'listen_choose':
      content = <ListenChooseFields data={local} onChange={handleChange} />
      break
    case 'listen_type':
      content = <ListenTypeFields data={local} onChange={handleChange} />
      break
    case 'match_pairs':
      content = <MatchPairsFields data={local} onChange={handleChange} />
      break
    case 'order_words':
      content = <OrderWordsFields data={local} onChange={handleChange} />
      break
    case 'fill_blank':
      content = <FillBlankFields data={local} onChange={handleChange} />
      break
    case 'multiple_choice':
      content = <MultipleChoiceFields data={local} onChange={handleChange} />
      break
    case 'spell':
      content = <SpellFields data={local} onChange={handleChange} />
      break
    case 'spot_letter':
      content = <SpotLetterFields data={local} onChange={handleChange} />
      break
    case 'read_choose':
      content = <ReadChooseFields data={local} onChange={handleChange} />
      break
    case 'true_false':
      content = <TrueFalseFields data={local} onChange={handleChange} />
      break
    default:
      content = <p className="text-muted-foreground text-sm">Unknown activity type: {String(activityType)}</p>
  }

  return (
    <div className="space-y-2">
      {props.label && <label className="text-sm leading-none font-medium">{props.label}</label>}
      <div className="border-input bg-muted/30 rounded-md border p-4">{content}</div>
      {props.helperText && <p className="text-muted-foreground text-sm">{props.helperText}</p>}
      <FormError fieldState={fieldState} />
    </div>
  )
}
