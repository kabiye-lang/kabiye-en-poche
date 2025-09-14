import React from 'react'
import { ScrollView } from 'react-native'

import { Card, Text, View } from '@/components/ui'

const sampleWordDetails = {
  word: 'Kabiyè Word 1',
  translation: 'Translation 1',
  pronunciation: 'Pronunciation 1',
  usageExamples: [
    'Usage example 1',
    'Usage example 2',
    // Add more examples as needed
  ],
  relatedWords: [
    { id: '1', word: 'Related Word 1' },
    { id: '2', word: 'Related Word 2' },
    // Add more related words as needed
  ],
}

const WordDetailsScreen: React.FC = () => {
  //   const { id } = useLocalSearchParams()

  const wordDetails = sampleWordDetails // Replace with actual data fetching logic

  return (
    <View flex className="bg-bg-grey">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text variant="h3" weight="bold" color="primary" className="mb-2.5">
          {wordDetails.word}
        </Text>
        <Text variant="h5" color="dark" className="mb-2.5">
          {wordDetails.translation}
        </Text>
        <Text variant="lg" color="grey" className="mb-5">
          {wordDetails.pronunciation}
        </Text>

        <Text variant="h6" weight="bold" color="dark" className="mb-2.5">
          Usage Examples
        </Text>
        {wordDetails.usageExamples.map((example, index) => (
          <Text key={index} variant="body" color="grey" className="mb-1">
            {example}
          </Text>
        ))}

        <Text variant="h6" weight="bold" color="dark" className="mb-2.5 mt-5">
          Related Words
        </Text>
        {wordDetails.relatedWords.map((relatedWord) => (
          <Card key={relatedWord.id} variant="elevated" className="mb-2.5 p-2.5">
            <Text variant="body" color="dark">
              {relatedWord.word}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  )
}

export default WordDetailsScreen
