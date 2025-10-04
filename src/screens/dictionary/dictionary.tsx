import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity } from 'react-native'

import { Link, router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { MagnifyingGlassIcon, SparkleIcon } from 'phosphor-react-native'

import { Card, Text, View } from '@/components/ui'
import { useDebounce } from '@/hooks/use-debounce'
import { useAvailableLetters, useRandomEntries, useSearchDictionary } from '@/hooks/use-dictionary'

const DictionaryScreen: React.FC = () => {
  const { t } = useLingui()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch random entries for "Word of the Day"
  const { data: randomEntries, isLoading: isLoadingRandom } = useRandomEntries(3)

  // Fetch available letters for alphabet browsing
  const { data: letters, isLoading: isLoadingLetters } = useAvailableLetters()

  // Search dictionary (only when user types)
  const {
    data: searchResults,
    isLoading: isSearching,
    isFetching,
  } = useSearchDictionary(debouncedQuery, 'all', debouncedQuery.length >= 2)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/dictionary/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const showSearchResults = debouncedQuery.length >= 2 && searchResults

  return (
    <View flex className="bg-bg-grey dark:bg-gray-900">
      <View className="px-2.5 py-2.5">
        <View className="flex-row items-center rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <MagnifyingGlassIcon size={24} className="mr-2.5 text-text-grey dark:text-gray-400" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder={t`Search for a word...`}
            className="flex-1 text-base text-gray-900 dark:text-gray-100"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
          />
          {(isSearching || isFetching) && <ActivityIndicator size="small" className="ml-2" />}
        </View>

        {/* Quick search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <View className="mt-2 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {searchResults.slice(0, 5).map((result) => (
              <Link key={result.entry_id} href={`/word/${result.headword}`} asChild onPress={() => setSearchQuery('')}>
                <TouchableOpacity className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                  <Text variant="body" weight="semibold" className="text-gray-900 dark:text-gray-100">
                    {result.headword}
                  </Text>
                  <Text variant="caption" className="mt-0.5 text-text-grey dark:text-gray-400">
                    {result.match_text}
                  </Text>
                </TouchableOpacity>
              </Link>
            ))}
            {searchResults.length > 5 && (
              <TouchableOpacity onPress={handleSearch} className="px-4 py-2">
                <Text variant="caption" className="text-center text-primary">
                  {t`See all ${searchResults.length} results`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 10 }}>
        {/* Word of the Day */}
        <View className="mt-2.5 px-2.5">
          <View className="mb-2.5 flex-row items-center">
            <SparkleIcon size={20} weight="duotone" className="mr-1.5 text-primary" />
            <Text variant="h5" weight="semibold">
              {t`Word of the Day`}
            </Text>
          </View>
          {isLoadingRandom ? (
            <ActivityIndicator className="py-4" />
          ) : (
            randomEntries?.map((entry) => (
              <Link key={entry.id} href={`/word/${entry.headword}`} asChild>
                <TouchableOpacity>
                  <Card className="mb-3 p-4">
                    <Text variant="lg" weight="bold" className="text-primary">
                      {entry.entry_data.headword}
                    </Text>
                    {entry.entry_data.pronunciations?.[0] && (
                      <Text variant="caption" className="mt-1 text-text-grey dark:text-gray-400">
                        [{entry.entry_data.pronunciations[0]}]
                      </Text>
                    )}
                    {entry.entry_data.senses[0]?.definitions[0] && (
                      <Text variant="body" className="mt-2 text-text-dark dark:text-gray-200">
                        {entry.entry_data.senses[0].definitions[0].translations.fr}
                      </Text>
                    )}
                  </Card>
                </TouchableOpacity>
              </Link>
            ))
          )}
        </View>

        {/* Browse by Letter */}
        <View className="mt-5 px-2.5">
          <Text variant="h5" weight="semibold" className="mb-2.5">
            {t`Browse by Letter`}
          </Text>
          {isLoadingLetters ? (
            <ActivityIndicator className="py-4" />
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {letters?.map((letter) => (
                <Link key={letter} href={`/dictionary/letter/${letter}`} asChild>
                  <TouchableOpacity>
                    <View className="items-center justify-center rounded-lg bg-white px-4 py-3 dark:bg-gray-800">
                      <Text variant="lg" weight="bold" className="text-primary">
                        {letter}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default DictionaryScreen
