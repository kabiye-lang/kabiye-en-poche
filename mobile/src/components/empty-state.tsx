import type { ReactNode } from 'react'

import { Pressable } from 'react-native'

import { Text, View } from './ui'

interface EmptyStateProps {
  /** A single Kabiyè letter, bled large behind the card. */
  glyph?: string
  title: string
  body: string
  /** Extra content between the body and the actions -- a query, a suggestion, a hint. */
  children?: ReactNode
  actions?: { label: string; onPress: () => void; primary?: boolean }[]
  /** Dashed border, for "nothing here yet" rather than "something went wrong". */
  pending?: boolean
}

/**
 * The card the app shows when it has nothing to show.
 *
 * These states are where a product usually says the least and the learner needs the most.
 * The rule here is that each one names what still works: no connection still leaves the
 * saved words and the alphabet, and an unwritten lesson still has 7 of 78 that are
 * written. A spinner or a shrug would say neither.
 *
 * No illustration. The oversized letter behind the card is the same device the rest of
 * the app uses, and it costs nothing to draw.
 */
export function EmptyState({ glyph, title, body, children, actions, pending }: EmptyStateProps) {
  return (
    <View
      className={
        pending
          ? 'border-border relative overflow-hidden rounded-[18px] border-[1.5px] border-dashed p-[22px]'
          : 'border-foreground relative overflow-hidden rounded-[18px] border-[1.5px] p-[22px]'
      }
    >
      {glyph ? (
        <View
          className="absolute -right-6 -top-10 opacity-[0.12]"
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text kabiye weight="bold" className="text-accent text-[160px] leading-[1]">
            {glyph}
          </Text>
        </View>
      ) : null}

      <Text weight="semibold" className="text-foreground text-[22px] leading-[1.15]">
        {title}
      </Text>
      <Text className="text-foreground-secondary mt-2 text-[15px] leading-[1.45]">{body}</Text>

      {children}

      {actions && actions.length > 0 ? (
        <View className="mt-5 flex-row flex-wrap gap-3">
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={action.onPress}
              className={
                action.primary
                  ? 'bg-foreground rounded-full px-5 py-3'
                  : 'border-foreground rounded-full border-[1.5px] px-5 py-3'
              }
            >
              <Text
                weight="semibold"
                className={action.primary ? 'text-background text-[15px]' : 'text-foreground text-[15px]'}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/**
 * Bone skeleton blocks, for loading.
 *
 * A spinner says "wait" and nothing else. Blocks in the shape of the content say what is
 * coming, and on paper they read as the page assembling rather than as an error.
 */
export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <View className="gap-3" accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={i}
          className="bg-background-tertiary h-5 rounded-md"
          style={{ width: `${[92, 78, 85, 60][i % 4]}%` }}
        />
      ))}
    </View>
  )
}
