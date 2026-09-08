import type { LessonExample } from '../../types/lesson-steps'

import { ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { useLanguage } from '../../hooks/use-language'
import { Button, Text, View } from '../ui'

interface ContentStepProps {
  /** The small label above the title: what kind of reading this is. */
  eyebrow: string
  title?: string
  content: string
  /** Sentences shown under the text -- for a rule step, the ones that use its words. */
  examples?: LessonExample[]
  onContinue: () => void
}

/**
 * A page of reading inside the lesson: a section's rule after the words it taught, or
 * the cultural notes before the finish.
 *
 * It used to be the pre-Laterite content card -- a grey box, the old type scale, the
 * lesson title repeated on top -- and for a while no step used it at all, so the
 * grammar prose was written and never shown. Now it is set like the Teach card: an
 * eyebrow, the title, the text at reading size, a rule, and the sentences as plain
 * rows. No audio control: there are no recordings, and absence beats a stand-in.
 */
const ContentStep = ({ eyebrow, title, content, examples, onContinue }: ContentStepProps) => {
  const { t } = useLingui()
  const { currentLanguage } = useLanguage()

  const sentences = (examples ?? []).filter((e) => e?.kbp?.trim())

  return (
    <View className="bg-background flex-1">
      <ScrollView contentContainerClassName="px-6 pb-8 pt-8" showsVerticalScrollIndicator={false}>
        <Text className="text-accent text-[13px] font-semibold uppercase tracking-[0.1em]">{eyebrow}</Text>

        {title ? (
          <Text weight="semibold" className="text-foreground mt-3 text-[26px] leading-[1.15]">
            {title}
          </Text>
        ) : null}

        <Text className="text-foreground mt-5 text-[17px] leading-[1.55]">{content}</Text>

        {sentences.length > 0 ? (
          <View className="mt-8">
            <View className="border-foreground border-t-[1.5px]" />
            {sentences.map((example, index) => {
              const gloss = currentLanguage === 'fr' ? example.fr || example.en : example.en || example.fr
              return (
                <View key={`${example.kbp}-${index}`} className="border-border border-b py-4">
                  <Text kabiye weight="bold" className="text-foreground text-[22px] leading-[1.2]">
                    {example.kbp}
                  </Text>
                  {gloss ? <Text className="text-foreground mt-1 text-[16px] leading-[1.4]">{gloss}</Text> : null}
                  {example.pronunciation ? (
                    // The generator writes the brackets itself ("[tɛɛ́]").
                    <Text kabiye className="text-foreground-secondary mt-1 text-[14px]">
                      {example.pronunciation}
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>
        ) : null}
      </ScrollView>

      <View className="px-6 pb-8">
        <Button variant="primary" onPress={onContinue}>
          {t`Continue`}
        </Button>
      </View>
    </View>
  )
}

export default ContentStep
