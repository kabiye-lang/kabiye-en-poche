import React from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'

import { useLingui } from '@lingui/react/macro'

import { ArrowRightIcon, InfoIcon } from '../../components/icons'
import { Card, Text, View } from '../../components/ui'
import { CrossReferences, SenseDefinitions, SubEntries } from '../../components/word/word-sections'
import { useEntryByTerm } from '../../hooks/use-dictionary'
import { useLanguage } from '../../hooks/use-language'
import { isRedirectEntry } from '../../utils/dictionary-helpers'

const WordDetailsScreen: React.FC = () => {
  const { id: term } = useLocalSearchParams<{ id: string }>()
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
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
            <Text variant="h4" weight="bold" className="text-foreground mb-3">
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
        {/* Headword */}
        <Text variant="h3" weight="bold" className="text-primary mb-2">
          {entry_data.headword}
        </Text>

        {/* Pronunciations */}
        {entry_data.pronunciations && entry_data.pronunciations.length > 0 && (
          <Text variant="lg" className="text-foreground-secondary mb-2">
            [{entry_data.pronunciations.join(', ')}]
          </Text>
        )}

        {/* Grammatical Info */}
        {entry_data.grammaticalInfo && (
          <View className="mb-4 flex-row items-center">
            <Text variant="body" className="text-foreground-secondary italic">
              {entry_data.grammaticalInfo}
            </Text>
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
              <Text key={idx} variant="body" className="text-foreground mb-1">
                • {variant.variant}
                {variant.pronunciation && ` [${variant.pronunciation}]`}
              </Text>
            ))}
          </View>
        )}

        <SenseDefinitions senses={entry_data.senses} translation={translation} />
        <SubEntries subEntries={entry_data.subEntries} translation={translation} />
        <CrossReferences crossRefs={entry_data.crossRefs} />
      </ScrollView>
    </View>
  )
}

export default WordDetailsScreen
