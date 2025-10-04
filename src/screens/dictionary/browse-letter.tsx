import React from 'react'
import { ActivityIndicator, FlatList, TouchableOpacity } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'

import { useLingui } from '@lingui/react/macro'
import { useHeaderHeight } from '@react-navigation/elements'

import { Card, Text, View } from '@/components/ui'
import { useEntriesByLetter } from '@/hooks/use-dictionary'
import { useLanguage } from '@/hooks/use-language'

const BrowseByLetterScreen: React.FC = () => {
  const { letter } = useLocalSearchParams<{ letter: string }>()
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()
  const headerHeight = useHeaderHeight()

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useEntriesByLetter(letter || '')

  const entries = data?.pages.flat() || []
  const translation = currentLanguage === 'fr' ? 'fr' : 'en'

  if (isLoading) {
    return (
      <View flex className="items-center justify-center bg-bg-grey dark:bg-gray-900">
        <ActivityIndicator size="large" className="text-primary" />
        <Text variant="body" className="mt-4 text-text-grey dark:text-gray-400">
          {t`Loading entries...`}
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View flex className="items-center justify-center bg-bg-grey px-4 dark:bg-gray-900">
        <Text variant="h6" className="text-center text-red-500">
          {t`Error loading entries`}
        </Text>
        <Text variant="body" className="mt-2 text-center text-text-grey dark:text-gray-400">
          {t`Please try again later`}
        </Text>
      </View>
    )
  }

  if (entries.length === 0) {
    return (
      <View flex className="items-center justify-center bg-bg-grey px-4 dark:bg-gray-900">
        <Text variant="h6" className="text-center text-text-dark dark:text-gray-100">
          {t`No entries found`}
        </Text>
        <Text variant="body" className="mt-2 text-center text-text-grey dark:text-gray-400">
          {t`No words start with this letter`}
        </Text>
      </View>
    )
  }

  return (
    <View flex className="bg-bg-grey dark:bg-gray-900" safeArea="vertical">
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: headerHeight / 1.5,
          paddingHorizontal: 10,
          paddingBottom: 20,
        }}
        ListHeaderComponent={
          <View className="mb-2.5 px-2.5">
            <Text variant="h5" weight="semibold">
              {t`Letter "${letter}"`}
            </Text>
            <Text variant="body" className="mt-1 text-text-grey dark:text-gray-400">
              {t`${entries.length}${hasNextPage ? '+' : ''} ${entries.length === 1 ? 'entry' : 'entries'}`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const entry = item.entry_data
          const firstDefinition = entry.senses[0]?.definitions[0]

          return (
            <Link href={`/word/${item.headword}`} asChild>
              <TouchableOpacity>
                <Card className="mb-3 p-4">
                  <Text variant="h6" weight="bold" className="text-primary">
                    {entry.headword}
                  </Text>

                  {entry.pronunciations?.[0] && (
                    <Text variant="caption" className="mt-1 text-text-grey dark:text-gray-400">
                      [{entry.pronunciations[0]}]
                    </Text>
                  )}

                  {entry.grammaticalInfo && (
                    <Text variant="caption" className="mt-1 italic text-text-grey dark:text-gray-400">
                      {entry.grammaticalInfo}
                    </Text>
                  )}

                  {firstDefinition && (
                    <Text variant="body" className="mt-2 text-text-dark dark:text-gray-200">
                      {firstDefinition.translations[translation]}
                    </Text>
                  )}

                  {entry.subEntries && entry.subEntries.length > 0 && (
                    <Text variant="caption" className="mt-2 text-text-grey dark:text-gray-400">
                      {t`+${entry.subEntries.length} ${entry.subEntries.length === 1 ? 'expression' : 'expressions'}`}
                    </Text>
                  )}
                </Card>
              </TouchableOpacity>
            </Link>
          )
        }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator size="small" className="text-primary" />
            </View>
          ) : null
        }
      />
    </View>
  )
}

export default BrowseByLetterScreen
