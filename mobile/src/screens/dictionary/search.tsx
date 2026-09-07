import React from 'react'
import { FlatList, Pressable } from 'react-native'

import { Link, router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { EmptyState } from '../../components/empty-state'
import { LanguageTag } from '../../components/language-tag'
import { Text, View } from '../../components/ui'
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
      <View flex className="bg-background px-6 pt-6">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <View key={row} className="py-[18px]">
            <View className="bg-background-tertiary h-7 w-2/5 rounded-md" />
            <View className="bg-background-tertiary mt-2 h-4 w-3/4 rounded-md" />
          </View>
        ))}
      </View>
    )
  }

  if (error) {
    return (
      <View flex className="bg-background px-6 pt-6">
        <EmptyState
          glyph="ŋ"
          title={t`The dictionary needs the network.`}
          body={t`Your saved words and the alphabet still work.`}
          actions={[{ label: t`Try again`, onPress: () => router.back(), primary: true }]}
        />
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
    <View flex className="bg-background" safeArea="top">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Search`}</Text>
        <Text kabiye weight="bold" className="text-foreground mt-2 text-[28px] leading-[1.15]">
          {query}
        </Text>
        <Text className="text-foreground-secondary mt-1 text-[15px]">{getSearchModeLabel()}</Text>

        {/* The filters re-run the search rather than filtering what came back: the
            three modes hit different columns, so a client-side filter would quietly
            hide results the other mode would have found. */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          {(
            [
              ['all', t`All`],
              ['kabiye', t`Kabiyè`],
              ['translation', searchLanguage === 'fr' ? t`French` : t`English`],
            ] as const
          ).map(([id, label]) => {
            const selected = id === 'all' ? searchMode === 'kabiye' && searchLanguage === 'all' : searchMode === id

            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() =>
                  router.setParams(
                    id === 'all'
                      ? { mode: 'kabiye', lang: 'all' }
                      : { mode: id, lang: id === 'kabiye' ? 'all' : searchLanguage }
                  )
                }
                className={
                  selected
                    ? 'bg-foreground rounded-full px-[18px] py-2'
                    : 'border-foreground rounded-full border-[1.5px] px-[18px] py-2'
                }
              >
                <Text
                  weight="semibold"
                  className={selected ? 'text-background text-[15px]' : 'text-foreground text-[15px]'}
                >
                  {id === 'all' ? `${label} · ${searchResults.length}` : label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.entry_id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="bg-border h-px" />}
        renderItem={({ item }) => (
          <Link href={`/word/${item.headword}`} asChild>
            <Pressable className="py-[18px]">
              <MatchedHeadword headword={item.headword} query={query || ''} />
              {item.entry_data.grammaticalInfo ? (
                <Text className="text-foreground-secondary mt-0.5 text-[14px] italic">
                  {item.entry_data.grammaticalInfo}
                </Text>
              ) : null}
              {item.match_text && item.match_text !== item.headword ? (
                <View className="mt-1 flex-row items-baseline gap-2">
                  <Text className="text-foreground flex-1 text-[16px] leading-[1.4]">{item.match_text}</Text>
                  {item.match_language ? <LanguageTag language={item.match_language} /> : null}
                </View>
              ) : null}
            </Pressable>
          </Link>
        )}
      />
    </View>
  )
}

/**
 * The headword with the part the learner typed underlined in laterite.
 *
 * Someone searching `kab` needs to see *why* each row came back, and in a dictionary
 * where the difference between a hit and a miss is often one letter (`ɩ` against `i`),
 * marking the matched span is the difference between a list and an answer. Only a
 * leading match is marked -- a mid-word coincidence is not what was searched for.
 */
function MatchedHeadword({ headword, query }: { headword: string; query: string }) {
  const trimmed = query.trim()
  const matches = trimmed.length > 0 && headword.toLowerCase().startsWith(trimmed.toLowerCase())
  const prefix = matches ? headword.slice(0, trimmed.length) : ''
  const rest = matches ? headword.slice(trimmed.length) : headword

  return (
    <Text kabiye weight="bold" className="text-foreground text-[28px] leading-[1.15]">
      {matches ? (
        <Text
          kabiye
          weight="bold"
          className="text-accent text-[28px]"
          style={{ textDecorationLine: 'underline', textDecorationColor: '#C4451C' }}
        >
          {prefix}
        </Text>
      ) : null}
      {rest}
    </Text>
  )
}

export default SearchResultsScreen
