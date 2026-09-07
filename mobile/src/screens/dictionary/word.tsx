import React from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native'

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
    return (
      <View flex className="bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text variant="body" className="text-foreground-secondary mt-4">
          {t`Loading...`}
        </Text>
      </View>
    )
  }

  if (error || !entry) {
    return (
      <View flex className="bg-background items-center justify-center px-4">
        <Text variant="h6" className="text-center text-red-500">
          {t`Word not found`}
        </Text>
        <Text variant="body" className="text-foreground-secondary mt-2 text-center">
          {t`The word you're looking for doesn't exist in our dictionary`}
        </Text>
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
      <ScrollView contentContainerStyle={{ paddingTop: headerHeight / 2, paddingHorizontal: 20, paddingBottom: 40 }}>
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

export default WordDetailsScreen
