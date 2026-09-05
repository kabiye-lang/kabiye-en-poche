import type { MatchPairsActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { Button, Card, Text, View } from '../ui'

interface MatchPairsStepProps {
  activity: LessonActivity
  onAnswer: (isCorrect: boolean, answer: string) => void
}

interface SelectedPair {
  value: string
  side: 'left' | 'right'
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Lay the two columns out so no row already holds its own match.
 *
 * Shuffling each column independently leaves the answer sitting on the adjacent
 * row surprisingly often -- with the three pairs these activities typically have,
 * one deal in six is a freebie. Redeal until every row is a mismatch (a derangement);
 * give up after a bounded number of tries so a degenerate set, such as two pairs
 * sharing a translation, can never spin here.
 */
export const dealColumns = (pairs: { left: string; right: string }[]) => {
  const left = shuffleArray(pairs.map((p) => p.left))
  const rightFor = new Map(pairs.map((p) => [p.left, p.right]))

  for (let attempt = 0; attempt < 20; attempt++) {
    const right = shuffleArray(pairs.map((p) => p.right))
    if (left.every((l, i) => rightFor.get(l) !== right[i])) return { left, right }
  }
  return { left, right: shuffleArray(pairs.map((p) => p.right)) }
}

const MatchPairsStep = ({ activity, onAnswer }: MatchPairsStepProps) => {
  const { t } = useLingui()
  const { getValue, currentLanguage } = useLanguage()

  const activityData = activity.data as MatchPairsActivityData | null | undefined
  const question = getValue(activity, 'question') || undefined
  const instructions = getValue(activity, 'instructions') || undefined

  // Transform pairs: support en/fr/kbp format (left=kbp, right=translation) or legacy left/right
  const rawPairs = activityData?.pairs ?? []
  const pairs: { left: string; right: string }[] = rawPairs.map((pair) => {
    if ('kbp' in pair && ('en' in pair || 'fr' in pair)) {
      const left = pair.kbp ?? ''
      const right = pair[currentLanguage] ?? pair.en ?? pair.fr ?? ''
      return { left, right }
    }
    const legacy = pair as { left: string; right: string | Record<string, string> }
    const right =
      typeof legacy.right === 'object' ? legacy.right[currentLanguage] || legacy.right.en || '' : legacy.right
    return { left: legacy.left, right: right || '' }
  })

  const [initialDeal] = useState(() => dealColumns(pairs))
  const [leftItems, setLeftItems] = useState<string[]>(initialDeal.left)
  const [rightItems, setRightItems] = useState<string[]>(initialDeal.right)
  const [selected, setSelected] = useState<SelectedPair | null>(null)
  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [showFeedback, setShowFeedback] = useState(false)

  // Reset state when activity changes (render-time state adjustment — avoids useEffect)
  const [prevActivity, setPrevActivity] = useState(activity)
  if (prevActivity !== activity) {
    setPrevActivity(activity)
    setSelected(null)
    setMatched(new Set())
    setShowFeedback(false)
    const deal = dealColumns(pairs)
    setLeftItems(deal.left)
    setRightItems(deal.right)
  }

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
      return 'border-green-500 bg-success-bg'
    }
    if (isSelected) {
      return 'border-primary bg-primary/10'
    }
    return 'border-border bg-card'
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question (optional; generic fallback when absent) */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="text-foreground text-center">
            {question ?? t`Match the pairs`}
          </Text>
        </Card>

        <Text variant="body" className="text-foreground-secondary mb-4 text-center">
          {instructions ?? t`Tap pairs to match them`}
        </Text>

        {/* Two columns for matching */}
        <View className="mb-4 flex-row gap-3">
          {/* Left column */}
          <View className="flex-1 gap-3">
            {leftItems.map((item, index) => (
              <Pressable
                key={`left-${index}`}
                onPress={() => handleSelect(item, 'left')}
                disabled={matched.has(item)}
                className={`rounded-xl border-2 p-4 ${getItemStyle(item, 'left')}`}
              >
                <Text
                  variant="body"
                  weight="bold"
                  className={`text-center ${matched.has(item) ? 'text-success-text' : 'text-foreground'}`}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Right column */}
          <View className="flex-1 gap-3">
            {rightItems.map((item, index) => (
              <Pressable
                key={`right-${index}`}
                onPress={() => handleSelect(item, 'right')}
                disabled={matched.has(item)}
                className={`rounded-xl border-2 p-4 ${getItemStyle(item, 'right')}`}
              >
                <Text
                  variant="body"
                  className={`text-center ${matched.has(item) ? 'text-success-text' : 'text-foreground'}`}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Progress indicator */}
        <Text variant="caption" className="text-foreground-secondary mb-4 text-center">
          {matched.size / 2} / {pairs.length} {t`matched`}
        </Text>

        {/* Feedback */}
        {showFeedback && (
          <Card className="bg-success-bg mb-4 p-4">
            <Text variant="h6" weight="bold" className="text-success-text text-center">
              {t`Perfect! All pairs matched!`}
            </Text>
          </Card>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
      <View className="border-border bg-card border-t px-6 py-4">
        <Button variant="primary" onPress={handleContinue} disabled={!showFeedback} className="w-full">
          <Text variant="body" weight="bold" className="text-white">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default MatchPairsStep
