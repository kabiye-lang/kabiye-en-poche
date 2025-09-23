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
        <Text variant="h3" weight="bold" className="mb-2.5 text-primary">
          {wordDetails.word}
        </Text>
        <Text variant="h5" className="mb-2.5 text-text-dark dark:text-gray-100">
          {wordDetails.translation}
        </Text>
        <Text variant="lg" className="mb-5 text-text-grey dark:text-gray-400">
          {wordDetails.pronunciation}
        </Text>

        <Text variant="h6" weight="bold" className="mb-2.5 text-text-dark dark:text-gray-100">
          Usage Examples
        </Text>
        {wordDetails.usageExamples.map((example, index) => (
          <Text key={index} variant="body" className="mb-1 text-text-grey dark:text-gray-400">
            {example}
          </Text>
        ))}

        <Text variant="h6" weight="bold" className="mb-2.5 mt-5 text-text-dark dark:text-gray-100">
          Related Words
        </Text>
        {wordDetails.relatedWords.map((relatedWord) => (
          <Card key={relatedWord.id} className="mb-2.5 p-2.5">
            <Text variant="body" className="text-text-dark dark:text-gray-100">
              {relatedWord.word}
            </Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  )
}

export default WordDetailsScreen
