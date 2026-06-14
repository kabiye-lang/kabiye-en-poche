import React from 'react'
import { ActivityIndicator, FlatList, Pressable } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { Card, Text, View } from '../../components/ui'
import { useSearchDictionary } from '../../hooks/use-dictionary'

const SearchResultsScreen: React.FC = () => {
  const { q: query, lang, mode } = useLocalSearchParams<{ q: string; lang?: string; mode?: string }>()
  const { t } = useLingui()

  const searchLanguage = (lang as 'all' | 'fr' | 'en') || 'all'
  const searchMode = (mode as 'kabiye' | 'translation') || 'kabiye'

  const { data: searchResults, isLoading, error } = useSearchDictionary(query || '', searchLanguage, !!query)

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
    return (
      <View flex className="bg-background items-center justify-center px-6">
        <Text className="mb-3 text-4xl">🔍</Text>
        <Text variant="h6" weight="semibold" className="text-foreground text-center">
          {t`No results for "${query}"`}
        </Text>
        <Text variant="body" className="text-foreground-secondary mt-2 text-center leading-5">
          {searchMode === 'kabiye'
            ? t`Check the spelling or try a different Kabiyè word. Remember, Kabiyè uses special characters like ɖ, ɛ, ɣ, ɩ, ŋ, ɔ, ʋ.`
            : t`Try a different translation or switch to Kabiyè search mode.`}
        </Text>
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
                  <Text variant="h6" weight="bold" className="text-primary flex-1">
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
                <Text variant="body" className="text-foreground mt-1">
                  {item.match_text ?? item.headword}
                </Text>
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
