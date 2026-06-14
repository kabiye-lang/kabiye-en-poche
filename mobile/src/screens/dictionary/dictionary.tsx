import React, { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, TextInput } from 'react-native'

import { Link, router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { MagnifyingGlassIcon, SparkleIcon } from '../../components/icons'
import { Text, View } from '../../components/ui'
import { WordOfTheDay } from '../../components/word-of-the-day'
import { useDebounce } from '../../hooks/use-debounce'
import { useAvailableLetters, useSearchDictionary, useWordOfTheDay } from '../../hooks/use-dictionary'
import { useLanguage } from '../../hooks/use-language'

const DictionaryScreen: React.FC = () => {
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'kabiye' | 'translation'>('kabiye')
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch random base headwords with homographs for "Word of the Day"
  const { data: wordOfTheDay, isLoading: isLoadingRandom } = useWordOfTheDay(3)

  // Fetch available letters for alphabet browsing
  const { data: letters, isLoading: isLoadingLetters } = useAvailableLetters()

  // Determine search language based on mode
  const searchLanguage: 'all' | 'fr' | 'en' = searchMode === 'kabiye' ? 'all' : currentLanguage

  // Search dictionary (only when user types)
  const {
    data: searchResults,
    isLoading: isSearching,
    isFetching,
  } = useSearchDictionary(debouncedQuery, searchLanguage, debouncedQuery.length >= 2)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/dictionary/search?q=${encodeURIComponent(searchQuery)}&lang=${searchLanguage}&mode=${searchMode}`)
    }
  }

  const getPlaceholder = () => {
    if (searchMode === 'kabiye') {
      return t`Search Kabiyè words...`
    }
    return currentLanguage === 'fr' ? t`Find Kabiyè words in French...` : t`Find Kabiyè words in English...`
  }

  const _getHelperText = () => {
    if (searchMode === 'kabiye') {
      return t`Search for Kabiyè words and see their translations`
    }
    return currentLanguage === 'fr'
      ? t`Search in French to find matching Kabiyè words`
      : t`Search in English to find matching Kabiyè words`
  }

  const showSearchResults = debouncedQuery.length >= 2 && searchResults

  return (
    <View flex className="bg-background">
      <View className="px-2.5 py-2.5">
        {/* Search Bar — primary interaction, no pre-decision required */}
        <View className="border-border bg-card flex-row items-center rounded-lg border px-3 py-2">
          <MagnifyingGlassIcon size={24} className="text-foreground-secondary mr-2.5" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder={getPlaceholder()}
            className="text-foreground flex-1 text-base"
            placeholderTextColor="#6E6B7B"
            returnKeyType="search"
          />
          {(isSearching || isFetching) && <ActivityIndicator size="small" className="ml-2" />}
        </View>

        {/* Search direction — secondary refinement below the input */}
        <View className="mt-2 flex-row items-center gap-2">
          <Text variant="caption" className="text-foreground-secondary">
            {t`Search in:`}
          </Text>
          <Pressable
            onPress={() => setSearchMode('kabiye')}
            className={`rounded-full px-3 py-1 ${searchMode === 'kabiye' ? 'bg-primary' : 'border-border border bg-transparent'}`}
          >
            <Text
              variant="caption"
              weight="semibold"
              className={searchMode === 'kabiye' ? 'text-primary-foreground' : 'text-foreground-secondary'}
            >
              {t`Kabiyè`}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSearchMode('translation')}
            className={`rounded-full px-3 py-1 ${searchMode === 'translation' ? 'bg-primary' : 'border-border border bg-transparent'}`}
          >
            <Text
              variant="caption"
              weight="semibold"
              className={searchMode === 'translation' ? 'text-primary-foreground' : 'text-foreground-secondary'}
            >
              {currentLanguage === 'fr' ? t`Français` : t`English`}
            </Text>
          </Pressable>
        </View>

        {/* Quick search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <View className="border-border bg-card mt-2 rounded-lg border">
            {searchResults.slice(0, 5).map((result) => (
              <Link key={result.entry_id} href={`/word/${result.headword}`} asChild onPress={() => setSearchQuery('')}>
                <Pressable className="border-border border-b px-4 py-3">
                  <Text variant="body" weight="semibold" className="text-foreground">
                    {result.headword}
                  </Text>
                  <Text variant="caption" className="text-foreground-secondary mt-0.5">
                    {result.match_text ?? result.headword}
                  </Text>
                </Pressable>
              </Link>
            ))}
            {searchResults.length > 5 && (
              <Pressable onPress={handleSearch} className="px-4 py-2">
                <Text variant="caption" className="text-primary text-center">
                  {t`See all ${searchResults.length} results`}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 10 }}>
        {/* Word of the Day */}
        <View className="mt-2.5 px-2.5">
          <View className="mb-2.5 flex-row items-center">
            <SparkleIcon size={20} weight="duotone" className="text-primary mr-1.5" />
            <Text variant="h5" weight="semibold" className="text-foreground">
              {t`Word of the Day`}
            </Text>
          </View>
          <WordOfTheDay words={wordOfTheDay ?? []} language={currentLanguage} isLoading={isLoadingRandom} />
        </View>

        {/* Browse by Letter */}
        <View className="mt-5 px-2.5 pb-6">
          <Text variant="h5" weight="semibold" className="text-foreground mb-2.5">
            {t`Browse by Letter`}
          </Text>
          {isLoadingLetters ? (
            <ActivityIndicator className="py-4" />
          ) : (
            <View className="flex-row flex-wrap justify-center gap-2">
              {letters?.map((letter) => (
                <Link key={letter} href={`/dictionary/letter/${letter}`} asChild>
                  <Pressable>
                    <View className="border-border items-center justify-center rounded-xl border bg-transparent px-4 py-3">
                      <Text variant="lg" weight="bold" className="text-primary">
                        {letter}
                      </Text>
                    </View>
                  </Pressable>
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
