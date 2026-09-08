import React, { useState } from 'react'
import { Pressable, ScrollView, TextInput } from 'react-native'

import { Link, router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { MagnifyingGlassIcon } from '../../components/icons'
import { LanguageTag } from '../../components/language-tag'
import { Skeleton, Text, View } from '../../components/ui'
import { WordOfTheDay } from '../../components/word-of-the-day'
import { useDebounce } from '../../hooks/use-debounce'
import {
  useAvailableLetters,
  useDictionaryStats,
  useSearchDictionary,
  useWordOfTheDay,
} from '../../hooks/use-dictionary'
import { useLanguage } from '../../hooks/use-language'
import { useMyWords } from '../../hooks/use-my-words'
import { usePlaceholderColor } from '../../hooks/use-theme-color'

const DictionaryScreen: React.FC = () => {
  const placeholderColor = usePlaceholderColor()
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  // One field searches all three languages. The old screen made the learner pick a
  // direction first -- "Kabiyè" or "English" -- which is a question they can only answer
  // if they already know which language the word they half-remember is in.
  const searchMode = 'kabiye' as const
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Fetch random base headwords with homographs for "Word of the Day"
  const { data: wordOfTheDay, isLoading: isLoadingRandom } = useWordOfTheDay(3)

  // Fetch available letters for alphabet browsing
  const { data: letters, isLoading: isLoadingLetters } = useAvailableLetters()
  const { data: stats } = useDictionaryStats()
  const myWords = useMyWords()

  // Determine search language based on mode
  const searchLanguage: 'all' | 'fr' | 'en' = searchMode === 'kabiye' ? 'all' : currentLanguage

  // Search dictionary (only when user types)
  const {
    data: searchResults,
    isLoading: isSearching,
    isFetching,
    isError: isSearchError,
  } = useSearchDictionary(debouncedQuery, searchLanguage, debouncedQuery.length >= 2)

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/dictionary/search?q=${encodeURIComponent(searchQuery)}&lang=${searchLanguage}&mode=${searchMode}`)
    }
  }

  const showSearchResults = debouncedQuery.length >= 2 && searchResults

  const entryCount = stats?.total_entries ?? null

  return (
    <View flex safeArea="top" className="bg-background">
      <ScrollView
        contentContainerClassName="px-6 pb-8 pt-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Dictionary`}</Text>

        {/* The count is the claim this product can make and no neighbouring app can: a
            942-page printed dictionary, decoded rather than retyped. It is read live so
            it cannot drift from what is actually loaded. */}
        <Text weight="semibold" className="text-foreground mt-2 text-[40px] leading-[1.0]">
          {entryCount ? t`${entryCount.toLocaleString()} entries` : t`Dictionary`}
        </Text>
        <Text className="text-foreground-secondary mt-3 text-[15px] leading-[1.4]">
          {t`In Kabiyè, French and English. Browse by letter, or keep the words you meet.`}
        </Text>

        {/* Leaf on paper with an ink border -- the one place on the screen that invites
            typing, so it is the one raised surface. */}
        <View className="bg-background-secondary border-foreground mt-6 flex-row items-center rounded-[14px] border-[1.5px] px-4 py-3">
          <MagnifyingGlassIcon size={22} className="text-foreground-secondary mr-3" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder={t`Kabiyè, français, English`}
            className="text-foreground flex-1 text-[17px]"
            placeholderTextColor={placeholderColor}
            returnKeyType="search"
            // Kabiyè is not in any device dictionary, so autocorrect actively fights the
            // user: typing "kalimiye" is corrected to "Kali,iye" and the search returns
            // nothing. Autocapitalise would also break the lowercase headwords.
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
          />
          {isSearching || isFetching ? (
            <Skeleton className="ml-2 h-5 w-5 rounded-full" />
          ) : (
            /* The letters a French keyboard cannot reach, one tap away from the field
               that needs them most. */
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t`Kabiyè letters`}
              onPress={() => router.push('/(tabs)/keyboard')}
              className="bg-background-tertiary ml-2 rounded-md px-2 py-1"
            >
              <Text kabiye className="text-foreground-secondary text-[15px]">
                ɛɖɔ
              </Text>
            </Pressable>
          )}
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/dictionary/letter/a')}
            className="border-foreground rounded-full border-[1.5px] px-[18px] py-3"
          >
            <Text weight="semibold" className="text-foreground text-[15px]">{t`Browse A–Ɩ–Z`}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/dictionary/my-words')}
            className="border-foreground rounded-full border-[1.5px] px-[18px] py-3"
          >
            <Text weight="semibold" className="text-foreground text-[15px]">
              {myWords.readCount > 0 ? t`My words · ${myWords.readCount}` : t`My words`}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/dictionary/pdf')}
            className="border-foreground rounded-full border-[1.5px] px-[18px] py-3"
          >
            <Text weight="semibold" className="text-foreground text-[15px]">{t`PDF`}</Text>
          </Pressable>
        </View>

        {/* A failed search used to render nothing at all: the spinner stopped, no
            results appeared, and the user was left unable to tell a network error from
            a word that genuinely is not in the dictionary. */}
        {isSearchError && debouncedQuery.length >= 2 && (
          <View className="border-border bg-card mt-2 rounded-lg border px-4 py-3">
            <Text variant="body" weight="semibold" className="text-foreground">
              {t`Couldn't search right now`}
            </Text>
            <Text variant="caption" className="text-foreground-secondary mt-0.5">
              {t`Check your connection and try again.`}
            </Text>
          </View>
        )}

        {/* Quick search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <View className="border-border bg-card mt-2 rounded-lg border">
            {searchResults.slice(0, 5).map((result) => (
              <Link key={result.entry_id} href={`/word/${result.headword}`} asChild onPress={() => setSearchQuery('')}>
                <Pressable className="border-border border-b px-4 py-3">
                  <Text kabiye variant="body" weight="semibold" className="text-foreground">
                    {result.headword}
                  </Text>
                  {/* Only render a subtitle when it says something the headword does
                      not. Falling back to the headword printed the word twice. */}
                  {result.match_text && result.match_text !== result.headword && (
                    <View className="mt-0.5 flex-row items-baseline gap-2">
                      <Text variant="caption" className="text-foreground-secondary flex-1">
                        {result.match_text}
                      </Text>
                      {result.match_language && <LanguageTag language={result.match_language} />}
                    </View>
                  )}
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
        {/* Word of the day, under a rule rather than in a card: it is the page's quiet
            second thing, not a competing surface. */}
        {wordOfTheDay && wordOfTheDay.length > 0 ? (
          <View className="border-foreground mt-10 border-t-[1.5px] pt-5">
            <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">
              {t`Word of the day`}
            </Text>
            <WordOfTheDay words={wordOfTheDay.slice(0, 1)} language={currentLanguage} isLoading={isLoadingRandom} />
          </View>
        ) : null}

        <View className="mt-10">
          <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">
            {t`Browse by letter`}
          </Text>
          {isLoadingLetters ? (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {Array.from({ length: 10 }, (_, tile) => (
                <Skeleton key={tile} className="h-11 w-11 rounded-xl" />
              ))}
            </View>
          ) : (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {letters?.map(({ letter }) => (
                <Link key={letter} href={`/dictionary/letter/${letter}`} asChild>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={letter}
                    className="bg-background-tertiary min-w-[44px] items-center rounded-full px-4 py-3"
                  >
                    <Text kabiye weight="bold" className="text-foreground text-[18px]">
                      {letter}
                    </Text>
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
