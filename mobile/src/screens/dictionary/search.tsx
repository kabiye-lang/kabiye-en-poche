import React from 'react'
import { ActivityIndicator, FlatList, Pressable } from 'react-native'

import { Link, router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { EmptyState } from '../../components/empty-state'
import { LanguageTag } from '../../components/language-tag'
import { Card, Text, View } from '../../components/ui'
import { useSearchDictionary } from '../../hooks/use-dictionary'
import { kabiyeSpellingOf } from '../../utils/kabiye-variants'

const SearchResultsScreen: React.FC = () => {
  const { q: query, lang, mode } = useLocalSearchParams<{ q: string; lang?: string; mode?: string }>()
  const { t } = useLingui()

  const searchLanguage = (lang as 'all' | 'fr' | 'en') || 'all'
  const searchMode = (mode as 'kabiye' | 'translation') || 'kabiye'

  const { data: searchResults, isLoading, error } = useSearchDictionary(query || '', searchLanguage, !!query)

  /**
   * Real headwords near the query, used only to check a suggested spelling exists.
   *
   * Searching the first two characters is one extra query and returns words the
   * dictionary actually holds -- which is the point: `kabiyeSpellingOf` will only
   * propose a spelling that appears in this pool, so the app can never suggest a word
   * it does not have. Runs only when the full query found nothing.
   */
  const prefix = (query || '').trim().slice(0, 2)
  const { data: nearby } = useSearchDictionary(prefix, 'all', Boolean(prefix) && searchResults?.length === 0)
  const suggestionPool = (nearby ?? []).map((row) => row.headword)

  const getSearchModeLabel = () => {
    if (searchMode === 'kabiye') {
      return t`Searching in Kabiyè`
    }
    return searchLanguage === 'fr' ? t`Searching in French` : t`Searching in English`
  }

  if (isLoading) {
    return (
      <View flex className="bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text variant="body" className="text-foreground-secondary mt-4">
          {t`Searching...`}
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View flex className="bg-background items-center justify-center px-4">
        <Text variant="h6" className="text-center text-red-500">
          {t`Error loading results`}
        </Text>
        <Text variant="body" className="text-foreground-secondary mt-2 text-center">
          {t`Please try again later`}
        </Text>
      </View>
    )
  }

  if (!searchResults || searchResults.length === 0) {
    // The suggestion is the word the learner most likely meant, spelled the way Kabiyè
    // spells it: their query with each plain letter swapped for the Kabiyè one a French
    // keyboard cannot reach. It is only offered when that spelling is actually in the
    // dictionary -- suggesting a word we do not hold would be inventing one.
    const suggestion = kabiyeSpellingOf(query, suggestionPool)

    return (
      <View flex className="bg-background px-6 pt-6">
        <EmptyState
          glyph="ɩ"
          title={t`Not in the dictionary`}
          body={t`Nothing matches that spelling.`}
          actions={[{ label: t`Search again`, onPress: () => router.back(), primary: true }]}
        >
          <Text kabiye weight="bold" className="text-foreground mt-4 text-[28px]">
            {query}
          </Text>
          {suggestion ? (
            <>
              <Text className="text-foreground-secondary mt-4 text-[15px]">{t`Did you mean`}</Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={suggestion}
                onPress={() => router.replace(`/word/${encodeURIComponent(suggestion)}`)}
                className="bg-background-tertiary mt-2 self-start rounded-full px-4 py-2"
              >
                <Text kabiye weight="bold" className="text-foreground text-[18px]">
                  {suggestion}
                </Text>
              </Pressable>
            </>
          ) : (
            <Text className="text-foreground-secondary mt-4 text-[15px] leading-[1.45]">
              {t`Kabiyè writes ɩ where French writes i, and ʋ where French writes u — try those.`}
            </Text>
          )}
        </EmptyState>
      </View>
    )
  }

  return (
    <View flex className="bg-background">
      <View className="mt-4 mb-2.5 px-2.5">
        <Text variant="h5" weight="semibold">
          {t`Search Results`}
        </Text>
        <Text variant="caption" className="text-foreground-secondary mt-1">
          {getSearchModeLabel()}
        </Text>
        <Text variant="body" className="text-foreground mt-1">
          {t`${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'} for "${query}"`}
        </Text>
      </View>
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.entry_id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Link href={`/word/${item.headword}`} asChild>
            <Pressable>
              <Card className="mb-4 p-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text kabiye variant="h6" weight="bold" className="text-primary flex-1">
                    {item.headword}
                  </Text>
                  <View className="bg-background-tertiary rounded-full px-2 py-1">
                    <Text variant="caption" className="text-foreground-secondary">
                      {item.match_type === 'headword'
                        ? t`Kabiyè`
                        : item.match_type === 'french_translation'
                          ? t`French`
                          : t`English`}
                    </Text>
                  </View>
                </View>
                {item.match_text && item.match_text !== item.headword && (
                  <View className="mt-1 flex-row items-baseline gap-2">
                    <Text variant="body" className="text-foreground flex-1">
                      {item.match_text}
                    </Text>
                    {item.match_language && <LanguageTag language={item.match_language} />}
                  </View>
                )}
                {item.entry_data.grammaticalInfo && (
                  <Text variant="caption" className="text-foreground-secondary mt-1 italic">
                    {item.entry_data.grammaticalInfo}
                  </Text>
                )}
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </View>
  )
}

export default SearchResultsScreen
