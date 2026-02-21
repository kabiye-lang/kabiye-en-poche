import type { MatchPairsActivityData } from '@/types/activity-data'
import type { LessonActivity } from '@/types/supabase'

import { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { Button, Card, Text, View } from '@/components/ui'
import { useLanguage } from '@/hooks/use-language'

interface MatchPairsStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

interface SelectedPair {
  value: string
  side: 'left' | 'right'
}

const MatchPairsStep = ({ activity, onAnswer }: MatchPairsStepProps) => {
  const { t } = useLingui()
  const { getValue, currentLanguage } = useLanguage()

  const activityData = activity.data as MatchPairsActivityData | null | undefined
  const question = getValue(activity, 'question') || ''
  const instructions = getValue(activity, 'instructions') || ''

  // Transform pairs to use correct language for 'right' values; always resolve to string
  const rawPairs = activityData?.pairs ?? []
  const pairs: { left: string; right: string }[] = rawPairs.map((pair) => {
    const right = typeof pair.right === 'object' ? pair.right[currentLanguage] || pair.right.en || '' : pair.right
    return { left: pair.left, right: right || '' }
  })

  const [leftItems, setLeftItems] = useState<string[]>([])
  const [rightItems, setRightItems] = useState<string[]>([])
  const [selected, setSelected] = useState<SelectedPair | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [showFeedback, setShowFeedback] = useState(false)

  // Reset state and shuffle when question changes (new activity)
  useEffect(() => {
    // Shuffle both sides independently
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }

    // Reset state
    setSelected(null)
    setMatched(new Set())
    setShowFeedback(false)

    // Shuffle items
    setLeftItems(shuffleArray(pairs.map((p) => p.left)))
    setRightItems(shuffleArray(pairs.map((p) => p.right)))
  }, [question, pairs])

  const handleSelect = (value: string, side: 'left' | 'right') => {
    if (matched.has(value)) return

    if (!selected) {
      // First selection
      setSelected({ value, side })
    } else if (selected.side === side) {
      // Selecting same side - replace selection
      setSelected({ value, side })
    } else {
      // Second selection from opposite side - check if match
      const isMatch = pairs.some(
        (pair) =>
          (pair.left === selected.value && pair.right === value) ||
          (pair.left === value && pair.right === selected.value)
      )

      if (isMatch) {
        // Correct match!
        setMatched(new Set([...matched, selected.value, value]))
        setSelected(null)

        // Check if all matched
        if (matched.size + 2 === pairs.length * 2) {
          setShowFeedback(true)
        }
      } else {
        // Wrong match - deselect after a brief moment
        setTimeout(() => {
          setSelected(null)
        }, 500)
      }
    }
  }

  const handleContinue = () => {
    const isCorrect = matched.size === pairs.length * 2
    onAnswer(isCorrect, `Matched ${matched.size / 2} of ${pairs.length} pairs`)
  }

  const getItemStyle = (value: string, side: 'left' | 'right') => {
    const isMatched = matched.has(value)
    const isSelected = selected?.value === value && selected?.side === side

    if (isMatched) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20'
    }
    if (isSelected) {
      return 'border-primary bg-primary/10'
    }
    return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-text-dark text-center dark:text-gray-100">
            {question}
          </Text>
        </Card>

        <Text variant="body" className="text-text-grey mb-4 text-center dark:text-gray-400">
          {instructions || t`Tap pairs to match them`}
        </Text>

        {/* Two columns for matching */}
        <View className="mb-4 flex-row gap-3">
          {/* Left column */}
          <View className="flex-1 gap-3">
            {leftItems.map((item, index) => (
              <TouchableOpacity
                key={`left-${index}`}
                onPress={() => handleSelect(item, 'left')}
                disabled={matched.has(item)}
                className={`rounded-xl border-2 p-4 ${getItemStyle(item, 'left')}`}
              >
                <Text
                  variant="body"
                  weight="bold"
                  className={`text-center ${
                    matched.has(item) ? 'text-green-700 dark:text-green-300' : 'text-text-dark dark:text-gray-100'
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Right column */}
          <View className="flex-1 gap-3">
            {rightItems.map((item, index) => (
              <TouchableOpacity
                key={`right-${index}`}
                onPress={() => handleSelect(item, 'right')}
                disabled={matched.has(item)}
                className={`rounded-xl border-2 p-4 ${getItemStyle(item, 'right')}`}
              >
                <Text
                  variant="body"
                  className={`text-center ${
                    matched.has(item) ? 'text-green-700 dark:text-green-300' : 'text-text-dark dark:text-gray-100'
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress indicator */}
        <Text variant="caption" className="text-text-grey mb-4 text-center dark:text-gray-400">
          {matched.size / 2} / {pairs.length} {t`matched`}
        </Text>

        {/* Feedback */}
        {showFeedback && (
          <Card className="mb-4 bg-green-50 p-4 dark:bg-green-900/20">
            <Text variant="h6" weight="bold" className="text-center text-green-700 dark:text-green-300">
              {t`Perfect! All pairs matched! 🎉`}
            </Text>
          </Card>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        {showFeedback && (
          <Button variant="primary" onPress={handleContinue} className="w-full">
            <Text variant="body" weight="bold" className="text-white">
              {t`Continue`}
            </Text>
          </Button>
        )}
      </View>
    </View>
  )
}

export default MatchPairsStep
