import type { DictionaryEntry } from '../../types/dictionary'

import React, { useMemo, useRef } from 'react'
import { FlatList, Pressable, ScrollView } from 'react-native'

import { router, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { Text, View } from '../../components/ui'
import { useAvailableLetters, useEntriesByLetter, useLetterCount } from '../../hooks/use-dictionary'
import { useLanguage } from '../../hooks/use-language'
import { translationFor } from '../../utils/dictionary-helpers'

/** The eight a French keyboard cannot reach. They are the laterite marks on the rail. */
const KABIYE_ONLY = 'ɖɛɣɩŋɔʋñ'

/**
 * Every word under one letter, with the alphabet itself down the right-hand edge.
 *
 * The rail is the point of this screen rather than a decoration: the whole reason a
 * learner browses by letter is that Kabiyè has eight letters their keyboard cannot type,
 * so the fastest way to reach `ɖ` is to see it in the alphabet and touch it. It doubles
 * as the letter's position in the alphabet, which the header alone cannot show.
 */
const BrowseByLetterScreen: React.FC = () => {
  const { letter } = useLocalSearchParams<{ letter: string }>()
  const current = letter || ''
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const listRef = useRef<FlatList<DictionaryEntry>>(null)

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useEntriesByLetter(current)
  const { data: total } = useLetterCount(current)
  const { data: letters } = useAvailableLetters()

  const entries = useMemo(() => data?.pages.flat() || [], [data])
  const translation = currentLanguage === 'fr' ? 'fr' : 'en'

  return (
    <View flex safeArea="top" className="bg-background">
      <View flex className="flex-row">
        <View flex>
          <FlatList
            ref={listRef}
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 12, paddingTop: 48, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="pb-4">
                <Text kabiye weight="bold" className="text-accent text-[96px] leading-[1.0]">
                  {current}
                </Text>
                <Text className="text-foreground-secondary mt-2 text-[15px]">
                  {total === undefined ? ' ' : total === 1 ? t`1 entry` : t`${total} entries`}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View className="bg-border h-px" />}
            renderItem={({ item }) => {
              const entry = item.entry_data
              const gloss = entry.senses[0]?.definitions[0]

              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push(`/word/${item.headword}`)}
                  className="py-[18px]"
                >
                  <Text kabiye weight="bold" className="text-foreground text-[24px] leading-[1.15]">
                    {entry.headword}
                  </Text>
                  {entry.grammaticalInfo ? (
                    <Text className="text-foreground-secondary mt-0.5 text-[14px] italic">{entry.grammaticalInfo}</Text>
                  ) : null}
                  {gloss ? (
                    <Text className="text-foreground mt-1 text-[16px] leading-[1.4]">
                      {translationFor(gloss.translations, translation, gloss.definition)}
                    </Text>
                  ) : null}
                </Pressable>
              )
            }}
            /* Bone skeleton blocks, never a spinner: a spinner says "wait" and tells the
               learner nothing about what is arriving. */
            ListEmptyComponent={
              isLoading ? (
                <View>
                  {[0, 1, 2, 3, 4, 5].map((row) => (
                    <View key={row} className="py-[18px]">
                      <View className="bg-background-tertiary h-6 w-2/5 rounded-md" />
                      <View className="bg-background-tertiary mt-2 h-4 w-3/4 rounded-md" />
                    </View>
                  ))}
                </View>
              ) : (
                <View className="border-foreground mt-4 rounded-[18px] border-[1.5px] p-6">
                  <Text className="text-foreground text-[17px] leading-[1.5]">
                    {error ? t`The dictionary needs the network.` : t`No words start with this letter.`}
                  </Text>
                </View>
              )
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
            }}
            onEndReachedThreshold={0.5}
          />
        </View>

        {/* The alphabet, down the edge. Andika because half of it is letters the
            interface face cannot draw, and scrollable because the dictionary indexes
            both cases separately -- around fifty entries, more than a phone is tall. */}
        <ScrollView
          className="w-9 pr-1.5"
          contentContainerStyle={{ paddingTop: 48, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {letters?.map((entry) => {
            const isCurrent = entry === current
            const isSpecial = KABIYE_ONLY.includes(entry)

            return (
              <Pressable
                key={entry}
                accessibilityRole="button"
                accessibilityLabel={entry}
                accessibilityState={{ selected: isCurrent }}
                onPress={() => {
                  if (isCurrent) {
                    listRef.current?.scrollToOffset({ offset: 0, animated: true })
                  } else {
                    router.replace(`/dictionary/letter/${entry}`)
                  }
                }}
                className={
                  isCurrent
                    ? 'bg-background-tertiary my-px items-center rounded-full py-0.5'
                    : 'my-px items-center py-0.5'
                }
              >
                <Text
                  kabiye
                  weight={isSpecial ? 'bold' : 'regular'}
                  className={isSpecial ? 'text-accent text-[11px]' : 'text-foreground-secondary text-[11px]'}
                >
                  {entry}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

export default BrowseByLetterScreen
