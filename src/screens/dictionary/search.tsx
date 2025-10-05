import React from 'react'
import { ActivityIndicator, FlatList, TouchableOpacity } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { Card, Text, View } from '@/components/ui'
import { useSearchDictionary } from '@/hooks/use-dictionary'

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
      <View flex className="items-center justify-center bg-bg-grey dark:bg-gray-900">
        <ActivityIndicator size="large" className="text-primary" />
        <Text variant="body" className="mt-4 text-text-grey dark:text-gray-400">
          {t`Searching...`}
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View flex className="items-center justify-center bg-bg-grey px-4 dark:bg-gray-900">
        <Text variant="h6" className="text-center text-red-500">
          {t`Error loading results`}
        </Text>
        <Text variant="body" className="mt-2 text-center text-text-grey dark:text-gray-400">
          {t`Please try again later`}
        </Text>
      </View>
    )
  }

  if (!searchResults || searchResults.length === 0) {
    return (
      <View flex className="items-center justify-center bg-bg-grey px-4 dark:bg-gray-900">
        <Text variant="h6" className="text-center text-text-dark dark:text-gray-100">
          {t`No results found`}
        </Text>
        <Text variant="body" className="mt-2 text-center text-text-grey dark:text-gray-400">
          {t`Try searching with different keywords`}
        </Text>
      </View>
    )
  }

  return (
    <View flex className="bg-bg-grey dark:bg-gray-900">
      <View className="mb-2.5 mt-4 px-2.5">
        <Text variant="h5" weight="semibold">
          {t`Search Results`}
        </Text>
        <Text variant="caption" className="mt-1 text-text-grey dark:text-gray-400">
          {getSearchModeLabel()}
        </Text>
        <Text variant="body" className="mt-1 text-text-dark dark:text-gray-200">
          {t`${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'} for "${query}"`}
        </Text>
      </View>
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.entry_id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Link href={`/word/${item.headword}`} asChild>
            <TouchableOpacity>
              <Card className="mb-4 p-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text variant="h6" weight="bold" className="flex-1 text-primary">
                    {item.headword}
                  </Text>
                  <View className="rounded-full bg-gray-200 px-2 py-1 dark:bg-gray-700">
                    <Text variant="caption" className="text-text-grey dark:text-gray-400">
                      {item.match_type === 'headword'
                        ? t`Kabiyè`
                        : item.match_type === 'french_translation'
                          ? t`French`
                          : t`English`}
                    </Text>
                  </View>
                </View>
                <Text variant="body" className="mt-1 text-text-dark dark:text-gray-200">
                  {item.match_text}
                </Text>
                {item.entry_data.grammaticalInfo && (
                  <Text variant="caption" className="mt-1 italic text-text-grey dark:text-gray-400">
                    {item.entry_data.grammaticalInfo}
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          </Link>
        )}
      />
    </View>
  )
}

export default SearchResultsScreen
