import type { Paradigm, VerbForm } from '../../hooks/use-conjugation'
import type { EntryData } from '../../types/dictionary'

import { useMemo, useState } from 'react'
import { Pressable } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { BOOK, SIL, useConjugation, useVerbForms } from '../../hooks/use-conjugation'
import { useLanguage } from '../../hooks/use-language'
import { stripTone } from '../../utils/strip-tone'
import { Text, View } from '../ui'

const SIMPLE_TABLES = new Set(['typique', 'simples'])

/** The order a learner reads a table in: the dictionary form first, then the order, then
 *  the aspects from bare to marked. Unknown rows keep their printed order after these. */
const ROW_ORDER = [
  'infinitif',
  'Infinitif',
  'Impératif',
  'Aoriste',
  'Inaccompli présent',
  'Accompli non lié',
  'Accompli lié',
  'Futur',
  'Comparatif inaccompli',
  'Comparatif accompli',
  'Négatif catégorique',
  'Négatif provisoire',
  'Lointain',
  'descriptif',
  'progressif passé',
  'accompli simple',
  'accompli avec complément',
  'accompli sans complément',
  'consécutif / impératif',
]
const rank = (code: string) => {
  const i = ROW_ORDER.indexOf(code)
  return i === -1 ? ROW_ORDER.length : i
}

/**
 * How the verb conjugates -- as a source printed it.
 *
 * Neither work gives every verb's forms, only its model verbs', so this card says
 * "conjugates like kpaɣʋ" and shows kpaɣʋ's table rather than filling in forms nobody
 * has written down. Two sources, two blocks: the sketch's pattern the entry's own `v.3c`
 * names (orthography only), and the book's class with its tone-marked tables -- the
 * simple table first, the rest behind one toggle. Every row is named in the reader's
 * language with a one-line gloss, because "Inaccompli présent" explains nothing to a
 * learner.
 */
export const Conjugation = ({ headword, conjugation }: { headword: string; conjugation: EntryData['conjugation'] }) => {
  const { t } = useLingui()
  const { data: paradigms } = useConjugation(conjugation)
  const { data: forms } = useVerbForms()
  if (!conjugation || !paradigms || paradigms.length === 0) return null

  const sil = paradigms.filter((p) => p.source === SIL)
  const book = paradigms.filter((p) => p.source === BOOK)

  return (
    <View className="mb-4">
      <Text variant="h6" weight="bold" className="text-foreground mb-1">
        {t`Conjugation`}
      </Text>
      <Text className="text-foreground-secondary mb-3 text-[14px] leading-[1.45]">
        {t`The tables are the ones our sources print for the model verb of this pattern. No form of ${headword} itself is written here that a source did not write.`}
      </Text>
      {sil.length > 0 ? (
        <PatternBlock title={t`Pattern ${conjugation.schema ?? ''}`} paradigms={sil} forms={forms} />
      ) : null}
      {book.length > 0 ? <ClassBlock paradigms={book} forms={forms} /> : null}
    </View>
  )
}

/** The sketch's typical-conjugation table: one model verb at a time, chips to switch. */
const PatternBlock = ({
  title,
  paradigms,
  forms,
}: {
  title: string
  paradigms: Paradigm[]
  forms?: Map<string, VerbForm>
}) => {
  const { t } = useLingui()
  const [modelIndex, setModelIndex] = useState(0)
  const current = paradigms[Math.min(modelIndex, paradigms.length - 1)]
  const models = paradigms.map((p) => p.model)
  return (
    <View className="mb-5">
      <Text weight="semibold" className="text-foreground text-[16px]">
        {title}
        <Text className="text-foreground-secondary text-[16px]"> · {t`like`} </Text>
        <Text kabiye weight="semibold" className="text-foreground text-[16px]">
          {models.join(', ')}
        </Text>
      </Text>
      {current.note ? <Text className="text-foreground-secondary mt-0.5 text-[13px]">{current.note}</Text> : null}
      {paradigms.length > 1 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {paradigms.map((p, i) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityState={{ selected: i === modelIndex }}
              onPress={() => setModelIndex(i)}
              className={
                i === modelIndex
                  ? 'bg-foreground rounded-full px-3 py-1'
                  : 'border-border rounded-full border px-3 py-1'
              }
            >
              <Text kabiye className={i === modelIndex ? 'text-background text-[14px]' : 'text-foreground text-[14px]'}>
                {p.model}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <FormRows paradigm={current} forms={forms} />
      <Text className="text-foreground-secondary mt-2 text-[12px]">{t`SIL 1999 dictionary, pp. 545–550`}</Text>
    </View>
  )
}

/** The book's class: the simple table, then the rest behind one toggle. */
const ClassBlock = ({ paradigms, forms }: { paradigms: Paradigm[]; forms?: Map<string, VerbForm> }) => {
  const { t } = useLingui()
  const [more, setMore] = useState(false)
  const byClass = useMemo(() => {
    const groups = new Map<string, Paradigm[]>()
    for (const p of paradigms) groups.set(p.key, [...(groups.get(p.key) ?? []), p])
    return [...groups.entries()]
  }, [paradigms])
  return (
    <>
      {byClass.map(([key, tables]) => {
        const model = tables[0]?.model
        const simple = tables.filter((p) => SIMPLE_TABLES.has(p.table))
        const rest = tables.filter((p) => !SIMPLE_TABLES.has(p.table))
        return (
          <View key={key} className="mb-5">
            <Text weight="semibold" className="text-foreground text-[16px]">
              {t`Class ${key}`}
              <Text className="text-foreground-secondary text-[16px]"> · {t`conjugates like`} </Text>
              <Text kabiye weight="semibold" className="text-foreground text-[16px]">
                {model}
              </Text>
            </Text>
            {(more ? tables : simple).map((p) => (
              <View key={p.id} className="mt-2">
                {more || simple.length > 1 ? (
                  <Text className="text-accent mt-1 text-[12px] font-semibold uppercase tracking-[0.1em]">
                    {p.table}
                  </Text>
                ) : null}
                <FormRows paradigm={p} forms={forms} />
              </View>
            ))}
            {rest.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => setMore((v) => !v)} className="mt-2 self-start">
                <Text className="text-foreground text-[14px] underline">{more ? t`Fewer forms` : t`More forms`}</Text>
              </Pressable>
            ) : null}
            <Text className="text-foreground-secondary mt-2 text-[12px]">
              {t`La conjugaison des verbes en kabiyè (2013)`}
            </Text>
          </View>
        )
      })}
    </>
  )
}

const FormRows = ({ paradigm, forms }: { paradigm: Paradigm; forms?: Map<string, VerbForm> }) => {
  const { currentLanguage } = useLanguage()
  const lang = currentLanguage === 'fr' ? 'fr' : 'en'
  const entries = Object.entries(paradigm.forms ?? {}).sort(([a], [b]) => rank(a) - rank(b))
  return (
    <View className="border-foreground mt-2 border-t-[1.5px]">
      {entries.map(([code, value]) => {
        const meta = forms?.get(code)
        const label = meta ? (lang === 'fr' ? meta.fr : meta.en) : code
        const gloss = meta ? (lang === 'fr' ? meta.gloss_fr : meta.gloss_en) : undefined
        const plain = paradigm.tone_written ? stripTone(value) : value
        return (
          <View key={code} className="border-border flex-row items-start gap-3 border-b py-2.5">
            <View className="w-[42%]">
              <Text className="text-foreground text-[14px] leading-[1.35]">{label}</Text>
              {gloss ? <Text className="text-foreground-secondary text-[12px] leading-[1.35]">{gloss}</Text> : null}
            </View>
            <View className="flex-1">
              <Text kabiye weight="semibold" className="text-foreground text-[17px] leading-[1.3]">
                {plain}
              </Text>
              {paradigm.tone_written && plain !== value ? (
                <Text kabiye className="text-foreground-secondary text-[13px]">
                  [{value}]
                </Text>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}
