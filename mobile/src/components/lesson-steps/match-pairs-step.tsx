import type { MatchPairsActivityData } from '../../types/activity-data'
import type { LessonActivity } from '../../types/supabase'

import { useState } from 'react'
import { Pressable, ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { Button, Text, View } from '../ui'

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

  // Reset state when activity changes (render-time state adjustment — avoids useEffect)
  const [prevActivity, setPrevActivity] = useState(activity)
  if (prevActivity !== activity) {
    setPrevActivity(activity)
    setSelected(null)
    setMatched(new Set())
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

  // Ink, laterite, or a hairline outline. There is no green here and no red: a matched
  // pair fills with ink because it is settled, not because it is "right", and a wrong
  // tap simply clears the selection.
  const tileClass = (value: string, side: 'left' | 'right') => {
    if (matched.has(value)) return 'bg-foreground border-foreground rounded-[14px] border-[1.5px] px-3.5 py-[18px]'
    if (selected?.value === value && selected?.side === side)
      return 'border-accent rounded-[14px] border-2 px-3.5 py-[18px]'
    return 'border-foreground rounded-[14px] border-[1.5px] px-3.5 py-[18px]'
  }

  const allMatched = matched.size === pairs.length * 2

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{t`Match`}</Text>
        <Text weight="medium" className="text-foreground mt-2 text-[26px] leading-[1.25]">
          {question ?? t`Match the pairs`}
        </Text>
        <Text className="text-foreground-secondary mt-2 text-[15px]">{instructions ?? t`Tap pairs to match them`}</Text>

        <View className="mt-7 flex-row gap-2.5">
          <View className="flex-1 gap-2.5">
            {leftItems.map((item, index) => (
              <Pressable
                key={`left-${index}`}
                accessibilityRole="button"
                accessibilityState={{ selected: matched.has(item) }}
                onPress={() => handleSelect(item, 'left')}
                disabled={matched.has(item)}
                className={tileClass(item, 'left')}
                style={{ minHeight: 72, justifyContent: 'center' }}
              >
                <Text
                  kabiye
                  weight="bold"
                  className={
                    matched.has(item)
                      ? 'text-background text-center text-[22px]'
                      : 'text-foreground text-center text-[22px]'
                  }
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-1 gap-2.5">
            {rightItems.map((item, index) => (
              <Pressable
                key={`right-${index}`}
                accessibilityRole="button"
                accessibilityState={{ selected: matched.has(item) }}
                onPress={() => handleSelect(item, 'right')}
                disabled={matched.has(item)}
                className={tileClass(item, 'right')}
                style={{ minHeight: 72, justifyContent: 'center' }}
              >
                <Text
                  className={
                    matched.has(item)
                      ? 'text-background text-center text-[17px]'
                      : 'text-foreground text-center text-[17px]'
                  }
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text className="text-foreground-secondary mt-5 text-[14px]">
          {matched.size / 2} / {pairs.length} {t`matched`}
        </Text>

        <View className="h-24" />
      </ScrollView>

      {/* The button is present from the start at low opacity rather than greyed: grey is
          not in this palette, and a button that appears late moves the footer. */}
      <View className="px-6 pb-4">
        <Button variant="primary" onPress={handleContinue} disabled={!allMatched} className="w-full">
          <Text weight="semibold" className="text-background text-[16px]">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default MatchPairsStep
