import type { EntryData } from '../../types/dictionary'

import React, { useState } from 'react'
import { Linking, Pressable, ScrollView, Share } from 'react-native'

import { Link, router, Stack, useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'

import { useLingui } from '@lingui/react/macro'

import { ArrowRightIcon, InfoIcon, ShareNetworkIcon } from '../../components/icons'
import { Card, Text, View } from '../../components/ui'
import { Conjugation } from '../../components/word/conjugation'
import { CrossReferences, SenseDefinitions, SubEntries } from '../../components/word/word-sections'
import { useAbbreviations } from '../../hooks/use-abbreviations'
import { useEntryByTerm } from '../../hooks/use-dictionary'
import { useLanguage } from '../../hooks/use-language'
import { useMyWords } from '../../hooks/use-my-words'
import { isRedirectEntry, translationFor } from '../../utils/dictionary-helpers'
import { describeGrammaticalInfo, grammaticalComponents } from '../../utils/grammatical-info'

const WordDetailsScreen: React.FC = () => {
  const { id: term } = useLocalSearchParams<{ id: string }>()
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const { addMet } = useMyWords()
  const { data: entry, isLoading, error } = useEntryByTerm(term || '')
  const { data: abbreviations } = useAbbreviations()
  const headerHeight = useHeaderHeight()
  const [explainCodes, setExplainCodes] = useState(false)
  if (isLoading) {
    // Bone blocks in the shape of the entry, never a spinner.
    return (
      <View flex className="bg-background px-6" style={{ paddingTop: headerHeight }}>
        <View className="bg-background-tertiary h-11 w-3/5 rounded-lg" />
        <View className="bg-background-tertiary mt-3 h-4 w-1/4 rounded-md" />
        <View className="bg-background-tertiary mt-8 h-5 w-full rounded-md" />
        <View className="bg-background-tertiary mt-3 h-5 w-5/6 rounded-md" />
      </View>
    )
  }

  if (error || !entry) {
    return (
      <View flex className="bg-background px-6" style={{ paddingTop: headerHeight }}>
        <View className="border-foreground rounded-[18px] border-[1.5px] p-6">
          <Text weight="semibold" className="text-foreground text-[20px]">
            {t`Not in the dictionary`}
          </Text>
          <Text className="text-foreground-secondary mt-2 text-[15px] leading-[1.5]">
            {t`We don't hold this word. Kabiyè writes ɩ where French writes i, and ʋ where French writes u — try those.`}
          </Text>
        </View>
      </View>
    )
  }

  const { entry_data } = entry
  const translation = currentLanguage === 'fr' ? 'fr' : 'en'
  // The print sends a dagger entry to its main word with "Voir": the `see` relation.
  const standardForm =
    entry_data.senses?.[0]?.lexRefs?.find((ref) => ref.type === 'see')?.targets?.[0] ??
    entry_data.crossRefs?.[0]?.targets?.[0]

  /**
   * Hand the word to whatever the reader wants to send it with.
   *
   * The gloss travels with it: a Kabiyè word alone, in a script the recipient's phone
   * may not draw, is not a message. The system sheet decides where it goes.
   */
  const shareWord = async () => {
    const gloss = entry_data.senses[0]?.definitions[0]
    const meaning = gloss ? translationFor(gloss.translations, translation, gloss.definition) : ''

    await Share.share({
      message: meaning ? `${entry_data.headword} — ${meaning}` : entry_data.headword,
    })
  }

  // Handle redirect entries
  if (isRedirectEntry(entry)) {
    return (
      <View flex className="bg-background" safeArea="vertical">
        <ScrollView contentContainerStyle={{ paddingTop: headerHeight / 2, paddingHorizontal: 20 }}>
          <Card className="p-5">
            <Text kabiye variant="h4" weight="bold" className="text-foreground mb-3">
              {entry_data.headword}
            </Text>
            <Text variant="body" className="text-foreground-secondary mb-4">
              {t`This is a variant form. See the main entry for the full definition.`}
            </Text>
            <Link href={`/word/${entry_data.mainEntry}`} asChild>
              <Pressable>
                <View className="bg-primary flex-row items-center rounded-lg px-4 py-3">
                  <Text variant="lg" weight="semibold" className="flex-1 text-white">
                    {t`View main entry:`} {entry_data.mainEntry}
                  </Text>
                  <ArrowRightIcon size={20} className="text-white" />
                </View>
              </Pressable>
            </Link>
          </Card>
        </ScrollView>
      </View>
    )
  }

  return (
    <View flex className="bg-background" safeArea="vertical">
      {/* The header lives in the root layout, but only this screen knows which word it
          is showing, so the share action is set from here. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t`Share this word`}
              hitSlop={8}
              onPress={() => void shareWord()}
              className="border-foreground h-9 w-9 items-center justify-center rounded-full border-[1.5px]"
            >
              <ShareNetworkIcon size={18} className="text-foreground" />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: headerHeight / 2, paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* The headword is the page. At 44 it is the first and largest thing, in the
            face that can actually draw it. */}
        <Text kabiye weight="bold" className="text-foreground text-[44px] leading-[1.05]">
          {entry_data.headword}
        </Text>

        {entry_data.pronunciations && entry_data.pronunciations.length > 0 && (
          <Text kabiye className="text-foreground-secondary mt-1 text-[18px]">
            [{entry_data.pronunciations.join(', ')}]
          </Text>
        )}

        {/* The grammatical class: the code as the dictionary prints it, then what it
            says in words, because `n.E, pA` means nothing to someone who has never met
            a noun class. The info button opens the codes one by one, with the facts a
            learner can hold on to -- the pronoun, the class mark, an example word. */}
        {entry_data.grammaticalInfo ? (
          <View className="mt-3">
            <View className="flex-row items-center">
              <Text kabiye className="text-foreground-secondary text-[16px] italic">
                {entry_data.grammaticalInfo}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t`What these codes mean`}
                accessibilityState={{ expanded: explainCodes }}
                className="ml-1.5"
                hitSlop={8}
                onPress={() => setExplainCodes((open) => !open)}
              >
                <InfoIcon size={16} weight={explainCodes ? 'fill' : 'regular'} className="text-foreground-secondary" />
              </Pressable>
            </View>
            {abbreviations ? (
              <Text className="text-foreground mt-1 text-[15px] leading-[1.45]">
                {describeGrammaticalInfo(entry_data.grammaticalInfo, abbreviations, translation)}
              </Text>
            ) : null}
            {explainCodes && abbreviations ? (
              <CodeExplanations
                components={grammaticalComponents(entry_data.grammaticalInfo, abbreviations, translation)}
                lang={translation}
              />
            ) : null}
          </View>
        ) : null}

        {/* A dagger entry is a regional form; the dictionary sends the reader to the
            standard word with "Voir", which arrives as the first cross-reference. */}
        {entry_data.dialectal ? (
          <Text className="text-foreground-secondary mt-3 text-[15px] leading-[1.45]">
            {t`† Regional variant.`}{' '}
            {standardForm ? (
              <>
                {t`Standard form:`}{' '}
                <Link href={`/word/${encodeURIComponent(standardForm)}`}>
                  <Text kabiye weight="semibold" className="text-foreground text-[15px] underline">
                    {standardForm}
                  </Text>
                </Link>
              </>
            ) : null}
          </Text>
        ) : null}

        {/* Where the word came from, when the dictionary says. */}
        {entry_data.etymology && entry_data.etymology.length > 0 ? (
          <Text className="text-foreground-secondary mt-2 text-[14px] italic leading-[1.4]">
            {entry_data.etymology.join(' · ')}
          </Text>
        ) : null}

        {/* Plural */}
        {entry_data.plural && (
          <View className="mb-4">
            <Text variant="body" className="text-foreground">
              <Text weight="semibold">{t`Plural:`}</Text> {entry_data.plural}
            </Text>
          </View>
        )}

        {/* Variant Forms */}
        {entry_data.variantRefs && entry_data.variantRefs.length > 0 && (
          <View className="mb-4">
            <Text variant="h6" weight="bold" className="text-foreground mb-2">
              {t`Variant Forms`}
            </Text>
            {entry_data.variantRefs.map((variant, idx) => (
              <Text kabiye key={idx} variant="body" className="text-foreground mb-1">
                • {variant.variant}
                {variant.pronunciation && ` [${variant.pronunciation}]`}
              </Text>
            ))}
          </View>
        )}

        <View className="border-foreground my-5 border-t-[1.5px]" />

        <SenseDefinitions senses={entry_data.senses} translation={translation} />
        <Conjugation headword={entry_data.headword} conjugation={entry_data.conjugation} />
        <SubEntries subEntries={entry_data.subEntries} translation={translation} />
        <CrossReferences crossRefs={entry_data.crossRefs} />
        <SourceLine entry={entry_data} />
      </ScrollView>

      {/* Two actions, both about writing rather than reading: the whole product for the
          audience that already speaks Kabiyè. "Write it" opens the keyboard; "Practise"
          adds the word to the list Profile counts. */}
      <View className="flex-row gap-3 px-5 pb-4">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/keyboard')}
          className="border-foreground flex-1 items-center rounded-full border-[1.5px] py-4"
        >
          <Text weight="semibold" className="text-foreground text-[16px]">{t`Write it`}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          // Await the write before navigating: My words reads storage on mount, so
          // pushing first showed an empty list for the word just added.
          onPress={async () => {
            await addMet([{ headword: entry_data.headword }])
            router.push('/dictionary/my-words')
          }}
          className="bg-foreground flex-[1.2] items-center rounded-full py-4"
        >
          <Text weight="semibold" className="text-background text-[17px]">{t`Practise`}</Text>
        </Pressable>
      </View>
    </View>
  )
}

/**
 * The codes of a grammatical class, one per row, with their meanings.
 *
 * A class row also carries the facts from the grammar sketch -- the pronoun that stands
 * for the noun (which is where the code itself comes from), the class mark, and one
 * example word -- and the panel closes with the one sentence about noun classes a
 * newcomer needs.
 */
const CodeExplanations = ({
  components,
  lang,
}: {
  components: ReturnType<typeof grammaticalComponents>
  lang: 'en' | 'fr'
}) => {
  const { t } = useLingui()
  const hasClass = components.some((c) => c.kind === 'class')
  return (
    <View className="border-foreground mt-3 border-t-[1.5px]">
      {components.map((c, index) => (
        <View key={`${c.code}-${index}`} className="border-border flex-row gap-3 border-b py-3">
          <Text kabiye weight="bold" className="text-foreground w-14 text-[16px]">
            {c.code}
          </Text>
          <View className="flex-1">
            <Text className="text-foreground text-[15px] leading-[1.45]">{c.meaning}</Text>
            {c.detail?.pronoun ? (
              <Text className="text-foreground-secondary mt-1 text-[13px] leading-[1.4]">
                {lang === 'fr' ? 'pronom' : 'pronoun'}{' '}
                <Text kabiye className="text-foreground-secondary text-[13px]">
                  {c.detail.pronoun}
                </Text>
                {c.detail.suffix ? (
                  <>
                    {' · '}
                    {lang === 'fr' ? 'marque' : 'class mark'}{' '}
                    <Text kabiye className="text-foreground-secondary text-[13px]">
                      {c.detail.suffix}
                    </Text>
                  </>
                ) : null}
                {c.detail.example ? (
                  <>
                    {' · '}
                    <Text kabiye className="text-foreground-secondary text-[13px]">
                      {c.detail.example.kbp}
                    </Text>{' '}
                    {lang === 'fr' ? `« ${c.detail.example.fr} »` : `“${c.detail.example.en}”`}
                  </>
                ) : null}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
      {hasClass ? (
        <Text className="text-foreground-secondary mt-3 text-[13px] leading-[1.45]">
          {t`Kabiyè nouns fall into ten classes. The pronoun that stands for a noun, the ending of an adjective, and words like “this” and “a certain” all change with its class — and the code is the pronoun.`}
        </Text>
      ) : null}
    </View>
  )
}

/** The page a page number can be read off, if the provenance tags carry one. */
function pageOf(entry: EntryData): number | undefined {
  const tags = Object.values(entry.provenance ?? {}).flat(2)
  for (const tag of tags) {
    const match = /^sil1999_print:p(\d+)$/.exec(String(tag))
    if (match) return Number(match[1])
  }
  return undefined
}

/**
 * Where this entry came from, and how to say it is wrong.
 *
 * Every word in this app traces to a printed source, and that is the claim the whole
 * project rests on; a learner who doubts a definition should be able to go and look it
 * up, and to tell us when the book and the language disagree. One quiet line, no card.
 */
function SourceLine({ entry }: { entry: EntryData }) {
  const { t } = useLingui()
  const page = pageOf(entry)
  const sources = entry.sources ?? []

  if (sources.length === 0) return null

  return (
    <View className="border-border mt-8 border-t pt-4">
      <Text className="text-foreground-secondary text-[13px] leading-[1.5]">
        {t`Source`}
        {' \u00B7 '}
        {page ? t`Kabiyè–French dictionary, p. ${page}` : sources.join(', ')}
        {' \u00B7 '}
        <Text
          className="text-foreground-secondary text-[13px] underline"
          onPress={() =>
            Linking.openURL(
              `mailto:hello@kabiye-en-poche.org?subject=${encodeURIComponent(`Mistake in ${entry.headword}`)}`
            )
          }
        >
          {t`Report a mistake`}
        </Text>
      </Text>
    </View>
  )
}

export default WordDetailsScreen
