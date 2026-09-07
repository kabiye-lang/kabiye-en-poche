import type { EntryData } from '../../types/dictionary'

import React from 'react'
import { Alert, Linking, Pressable, ScrollView } from 'react-native'

import { Link, router, useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'

import { useLingui } from '@lingui/react/macro'

import { ArrowRightIcon, InfoIcon } from '../../components/icons'
import { Card, Text, View } from '../../components/ui'
import { CrossReferences, SenseDefinitions, SubEntries } from '../../components/word/word-sections'
import { useEntryByTerm } from '../../hooks/use-dictionary'
import { useLanguage } from '../../hooks/use-language'
import { useMyWords } from '../../hooks/use-my-words'
import { isRedirectEntry } from '../../utils/dictionary-helpers'

const WordDetailsScreen: React.FC = () => {
  const { id: term } = useLocalSearchParams<{ id: string }>()
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const { addMet } = useMyWords()
  const { data: entry, isLoading, error } = useEntryByTerm(term || '')
  const headerHeight = useHeaderHeight()
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

        {/* Grammatical Info */}
        {entry_data.grammaticalInfo && (
          <View className="mt-2 flex-row items-center">
            <Text className="text-foreground-secondary text-[16px] italic">{entry_data.grammaticalInfo}</Text>
            <Pressable
              className="ml-1.5"
              hitSlop={8}
              onPress={() => {
                Alert.alert(
                  t`Abbreviations`,
                  [
                    'n.m. = nom masculin',
                    'n.f. = nom féminin',
                    'n.kl = noun class',
                    'v. = verbe',
                    'adj. = adjectif',
                    'adv. = adverbe',
                    'prép. = préposition',
                    'conj. = conjonction',
                    'pron. = pronom',
                    'interj. = interjection',
                  ].join('\n')
                )
              }}
            >
              <InfoIcon size={16} weight="regular" className="text-foreground-secondary" />
            </Pressable>
          </View>
        )}

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
