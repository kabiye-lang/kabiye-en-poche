import { useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

import { Button, Text } from '@/components/ui'

interface OrderWordsProps {
  question: {
    words: string[]
  }
  onAnswerSelected: (_answer: string) => void
  showFeedback: boolean
}

interface Word {
  key: string
  label: string
}

const OrderWords: React.FC<OrderWordsProps> = ({ question, onAnswerSelected, showFeedback }) => {
  const [words, setWords] = useState<Word[]>(question.words.map((word, index) => ({ key: `${index}`, label: word })))
  const [selectedWords, setSelectedWords] = useState<Word[]>([])
  const [isValidated, setIsValidated] = useState(false)

  const handleWordSelect = (word: Word) => {
    setWords(words.filter((w) => w.key !== word.key))
    setSelectedWords([...selectedWords, word])
  }

  const handleWordDeselect = (word: Word) => {
    setSelectedWords(selectedWords.filter((w) => w.key !== word.key))
    setWords([...words, word])
  }

  const handleValidate = () => {
    const userAnswer = selectedWords.map((item) => item.label).join(' ')
    onAnswerSelected(userAnswer)
    setIsValidated(true)
  }

  return (
    <View className="items-center justify-center p-2.5">
      <ScrollView
        horizontal
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}
      >
        {words.map((word) => (
          <TouchableOpacity
            key={word.key}
            className="m-1 rounded-lg bg-gray-200 p-2.5"
            onPress={() => handleWordSelect(word)}
            disabled={showFeedback || isValidated}
          >
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <Text variant="body" className="text-center text-text-dark dark:text-gray-100">
                {word.label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View className="mt-5 flex-row flex-wrap justify-center">
        {selectedWords.map((word) => (
          <TouchableOpacity
            key={word.key}
            className="m-1 rounded-lg bg-blue-200 p-2.5"
            onPress={() => handleWordDeselect(word)}
            disabled={showFeedback || isValidated}
          >
            <Animated.View entering={FadeIn} exiting={FadeOut}>
              <Text variant="body" className="text-center text-text-dark dark:text-gray-100">
                {word.label}
              </Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
      {!isValidated && (
        <Button variant="primary" onPress={handleValidate} className="mt-5">
          Validate
        </Button>
      )}
    </View>
  )
}

export default OrderWords
