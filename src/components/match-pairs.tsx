import React, { useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import { Text } from '@/components/ui'

// Utility function to shuffle an array
const shuffleArray = (array: string[]): string[] => {
  return array.sort(() => Math.random() - 0.5)
}

interface MatchPairsProps {
  question: {
    pairs: [string, string][]
    correctAnswer: string
  }
  onAnswerSelected: (_answer: string) => void
  showFeedback: boolean
}

interface SelectedItem {
  item: string
  index: number
  type: 'country' | 'capital'
}

const MatchPairs: React.FC<MatchPairsProps> = ({ question, onAnswerSelected, showFeedback }) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [matchedPairs, setMatchedPairs] = useState<string[]>([])
  const [shuffledCountries, setShuffledCountries] = useState<string[]>([])
  const [shuffledCapitals, setShuffledCapitals] = useState<string[]>([])

  useEffect(() => {
    const countries = question.pairs.map((pair) => pair[0])
    const capitals = question.pairs.map((pair) => pair[1])

    setShuffledCountries(shuffleArray(countries))
    setShuffledCapitals(shuffleArray(capitals))
  }, [question])

  const handleSelect = (item: string, index: number, type: 'country' | 'capital') => {
    if (selectedItems.length === 0 || (selectedItems.length === 1 && selectedItems[0].type !== type)) {
      setSelectedItems([...selectedItems, { item, index, type }])
    }

    if (selectedItems.length === 1) {
      const isCorrect = question.pairs.some(
        (pair) =>
          (pair[0] === selectedItems[0].item && pair[1] === item) ||
          (pair[1] === selectedItems[0].item && pair[0] === item)
      )

      if (isCorrect) {
        setMatchedPairs([...matchedPairs, selectedItems[0].item, item])
        setSelectedItems([])
        if (matchedPairs.length + 2 === question.pairs.length * 2) {
          onAnswerSelected(question.correctAnswer)
        }
      } else {
        setTimeout(() => setSelectedItems([]), 1000)
      }
    }
  }

  const renderOption = (item: string, index: number, type: 'country' | 'capital') => {
    const isSelected = selectedItems.some((selected) => selected.item === item)
    const isMatched = matchedPairs.includes(item)

    return (
      <TouchableOpacity
        key={`${item}-${index}`}
        className={`my-1 items-center rounded-lg p-4 ${
          isMatched ? 'bg-green-200' : isSelected ? 'bg-blue-200' : 'bg-gray-200'
        }`}
        onPress={() => handleSelect(item, index, type)}
        disabled={showFeedback || isMatched || isSelected}
      >
        <Text variant="body" color="dark" className="text-center">
          {item}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View className="flex-col items-center justify-center">
      <Text variant="lg" weight="bold" className="mb-2.5">
        Match the pairs:
      </Text>
      <View className="w-full flex-row justify-between">
        <View className="w-[45%]">{shuffledCountries.map((item, index) => renderOption(item, index, 'country'))}</View>
        <View className="w-[45%]">{shuffledCapitals.map((item, index) => renderOption(item, index, 'capital'))}</View>
      </View>
    </View>
  )
}

export default MatchPairs
