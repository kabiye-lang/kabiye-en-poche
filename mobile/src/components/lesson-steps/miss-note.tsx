import { useLingui } from '@lingui/react/macro'

import { Text } from '../ui'

interface MissNoteProps {
  /** Whether this miss happened in the review stage rather than the first pass. */
  isReview?: boolean
  className?: string
}

/**
 * The closing line under a wrong answer.
 *
 * Six step components wrote this sentence inline, once each -- one place it can drift
 * from what actually happens, and did, once review existed: a miss in the lesson still
 * promises a retry, but a second miss in review has none coming. It stays in My words
 * instead, which is what this line says there.
 */
const MissNote = ({ isReview, className }: MissNoteProps) => {
  const { t } = useLingui()
  return (
    <Text className={className ?? 'text-foreground-secondary mt-2 text-[15px] leading-[1.5]'}>
      {isReview ? t`It stays in My words to practise.` : t`We'll ask this one again at the end.`}
    </Text>
  )
}

export default MissNote
