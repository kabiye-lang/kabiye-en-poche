import type { LessonExample } from '../../types/lesson-steps'

import { ScrollView } from 'react-native'

import { router } from 'expo-router'

import { useLingui } from '@lingui/react/macro'

import { usableAudioUrl } from '../../utils/audio-source'
import { SpeakerSlashIcon } from '../icons'
import { Button, Text, View } from '../ui'
import TeachContent from './teach-content'

interface TeachStepProps {
  example: LessonExample
  onContinue: () => void
  /**
   * Whether this is the first word in the lesson with no recording.
   *
   * The absence is a fact about the lesson, not about this word -- there are no
   * recordings at all yet -- so it is stated once, on the first card that meets it, and
   * every card after it is simply silent. It used to appear on all of them, which turned
   * one honest sentence into a refrain a learner reads eight times and stops seeing.
   */
  explainMissingAudio?: boolean
}

/**
 * One word, on its own screen, before the learner is asked to do anything with it.
 *
 * The lesson used to open with three essays of continuous prose covering a dozen words
 * at once, then run a flat list of exercises. A learner met `sɛtʋ` in the middle of a
 * paragraph and was asked to spell it eleven screens later. Laterite pairs them: this
 * card, then immediately a question about this word.
 *
 * The word/gloss/note/chips are `TeachContent`, shared with the "Show the word again"
 * overlay in review (see `lesson.tsx`); this component adds the eyebrow, the missing-audio
 * notice, and the two controls that advance or leave the lesson, none of which belong in
 * an overlay sitting over a live question.
 */
const TeachStep = ({ example, onContinue, explainMissingAudio }: TeachStepProps) => {
  const { t } = useLingui()

  const audio = usableAudioUrl(example.audio_url)

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-accent-text text-[13px] font-semibold uppercase tracking-[0.1em]">{t`New word`}</Text>

        <TeachContent example={example} />

        {/* Absence beats a stand-in: no recording means no control, never a control that
            plays nothing. Said once per lesson, and in terms of the language rather than
            of our own policy -- Kabiyè does not write tone, so a wrong voice would teach
            the wrong word, which is the learner's problem and not just ours. */}
        {!audio && explainMissingAudio ? (
          <View className="bg-background-tertiary mt-6 flex-row items-start gap-3 rounded-[14px] px-4 py-3">
            <SpeakerSlashIcon size={18} className="text-foreground-secondary mt-[2px]" />
            <Text className="text-foreground-secondary flex-1 text-[14px] leading-[1.4]">
              {t`No recordings yet. Kabiyè does not write tone, and the wrong voice teaches the wrong word — so this lesson waits for a real one.`}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row gap-3 px-6 pb-8">
        {example.lexeme_id ? (
          <Button
            variant="outline"
            className="flex-1"
            onPress={() => router.push(`/word/${encodeURIComponent(example.kbp)}`)}
          >
            {/* "Entry" named a noun, not what the button does. */}
            {t`Look it up`}
          </Button>
        ) : null}
        <Button variant="primary" className="flex-[1.4]" onPress={onContinue}>
          {t`Try it`}
        </Button>
      </View>
    </View>
  )
}

export default TeachStep
