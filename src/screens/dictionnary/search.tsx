import React from 'react'
import { FlatList } from 'react-native'

import { Link, useLocalSearchParams } from 'expo-router'

import { Card, Text, View } from '@/components/ui'

const sampleResults = [
  { id: '1', word: 'Kabiyè Word 1', translation: 'Translation 1' },
  { id: '2', word: 'Kabiyè Word 2', translation: 'Translation 2' },
  // Add more sample data as needed
]

const SearchResultsScreen: React.FC = () => {
  const { s: query } = useLocalSearchParams()

  const renderItem = ({ item }: { item: { id: string; word: string; translation: string } }) => (
    <Link asChild href={`/word/${item.id}`}>
      <Card className="mb-4 p-4">
        <Text variant="h6" weight="bold" color="dark" className="mb-1">
          {item.word}
        </Text>
        <Text variant="body" color="grey">
          {item.translation}
        </Text>
      </Card>
    </Link>
  )

  return (
    <View flex className="bg-bg-grey">
      <Text variant="h4" weight="semibold" className="mb-2.5 ml-2.5">
        Search Results for &quot;{query}&quot;
      </Text>
      <FlatList
        data={sampleResults}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </View>
  )
}

export default SearchResultsScreen
