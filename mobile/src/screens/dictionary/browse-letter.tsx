import React from 'react'
import { ActivityIndicator, FlatList, Pressable } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'

import { useLingui } from '@lingui/react/macro'

import { Card, Text, View } from '../../components/ui'
import { useEntriesByLetter } from '../../hooks/use-dictionary'
import { useLanguage } from '../../hooks/use-language'

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
      <View flex className="bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text variant="body" className="text-foreground-secondary mt-4">
          {t`Loading entries...`}
        </Text>
      </View>
    )
  }

  if (error) {
    return (
      <View flex className="bg-background items-center justify-center px-4">
        <Text variant="h6" className="text-center text-red-500">
          {t`Error loading entries`}
        </Text>
        <Text variant="body" className="text-foreground-secondary mt-2 text-center">
          {t`Please try again later`}
        </Text>
      </View>
    )
  }

  if (entries.length === 0) {
    return (
      <View flex className="bg-background items-center justify-center px-4">
        <Text variant="h6" className="text-foreground text-center">
          {t`No entries found`}
        </Text>
        <Text variant="body" className="text-foreground-secondary mt-2 text-center">
          {t`No words start with this letter`}
        </Text>
      </View>
    )
  }

  return (
    <View flex className="bg-background" safeArea="vertical">
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
            <Text variant="body" className="text-foreground-secondary mt-1">
              {t`${entries.length}${hasNextPage ? '+' : ''} ${entries.length === 1 ? 'entry' : 'entries'}`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const entry = item.entry_data
          const firstDefinition = entry.senses[0]?.definitions[0]

          return (
            <Link href={`/word/${item.headword}`} asChild>
              <Pressable>
                <Card className="mb-3 p-4">
                  <Text variant="h6" weight="bold" className="text-primary">
                    {entry.headword}
                  </Text>

                  {entry.pronunciations?.[0] && (
                    <Text variant="caption" className="text-foreground-secondary mt-1">
                      [{entry.pronunciations[0]}]
                    </Text>
                  )}

                  {entry.grammaticalInfo && (
                    <Text variant="caption" className="text-foreground-secondary mt-1 italic">
                      {entry.grammaticalInfo}
                    </Text>
                  )}

                  {firstDefinition && (
                    <Text variant="body" className="text-foreground mt-2">
                      {firstDefinition.translations[translation]}
                    </Text>
                  )}

                  {entry.subEntries && entry.subEntries.length > 0 && (
                    <Text variant="caption" className="text-foreground-secondary mt-2">
                      {t`+${entry.subEntries.length} ${entry.subEntries.length === 1 ? 'expression' : 'expressions'}`}
                    </Text>
                  )}
                </Card>
              </Pressable>
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
