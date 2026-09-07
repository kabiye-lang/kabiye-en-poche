import { View } from './view'

/**
 * A bone block standing in for content that has not arrived.
 *
 * The direction has no spinners: a spinner says "wait" and nothing else, while a block
 * in the shape of the thing being fetched says what is coming and stops the layout
 * jumping when it lands. Recessed paper, never grey — grey is not in this palette.
 */
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <View className={`bg-background-tertiary rounded-md ${className}`} />
)

/** The common case: a run of rows, each a headword over a gloss. */
export const SkeletonRows = ({ rows = 5 }: { rows?: number }) => (
  <View>
    {Array.from({ length: rows }, (_, row) => (
      <View key={row} className="py-[18px]">
        <Skeleton className="h-6 w-2/5" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </View>
    ))}
  </View>
)
