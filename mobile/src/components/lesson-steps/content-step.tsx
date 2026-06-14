import { Pressable, ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { useAudio } from '../../hooks/use-audio'
import { getDifficultyBgClass, getDifficultyLabel, getDifficultyTextClass } from '../../utils/difficulty'
import { SpeakerHighIcon } from '../icons'
import { Button, Card, Text, View } from '../ui'

interface Example {
  kbp: string
  en: string
  fr: string
  pronunciation?: string
  audio_url?: string
}

interface ContentStepProps {
  lessonTitle?: string
  title?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  content: string
  examples?: unknown // Raw examples from database
  onContinue: () => void
}

const ContentStep = ({
  lessonTitle,
  title,
  difficulty,
  content,
  examples: rawExamples,
  onContinue,
}: ContentStepProps) => {
  const { t } = useLingui()
  const { playAudio } = useAudio()

  // Transform raw examples from database into typed format
  const examples: Example[] | undefined = rawExamples
    ? Array.isArray(rawExamples)
      ? rawExamples.map((ex: Record<string, unknown>) => ({
          kbp: (ex.kbp as string) || '',
          en: (ex.en as string) || '',
          fr: (ex.fr as string) || '',
          pronunciation: ex.pronunciation as string | undefined,
          audio_url: ex.audio_url as string | undefined,
        }))
      : []
    : undefined

  const difficultyLabel = difficulty ? getDifficultyLabel(difficulty) : undefined

  const difficultyBgClass = difficulty ? getDifficultyBgClass(difficulty) : ''
  const difficultyTextClass = difficulty ? getDifficultyTextClass(difficulty) : ''

  const handlePlayAudio = (audioUrl: string) => {
    if (audioUrl) {
      playAudio(audioUrl)
    }
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Lesson Header */}
        {(lessonTitle || difficulty) && (
          <View className="mt-4 mb-6">
            {title && (
              <Text variant="h3" weight="bold" className="text-primary mb-2">
                {lessonTitle}
              </Text>
            )}
            {difficulty && (
              <View className="flex-row items-center">
                <View className={`rounded-full px-3 py-1 ${difficultyBgClass}`}>
                  <Text variant="caption" weight="semibold" className={difficultyTextClass}>
                    {difficultyLabel}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Main Content */}
        <Card className="mb-4 p-6">
          <Text variant="h6" weight="bold" className="text-foreground mb-4">
            {title}
          </Text>
          <Text variant="lg" className="text-foreground leading-7">
            {content}
          </Text>
        </Card>

        {/* Examples */}
        {examples && examples.length > 0 && (
          <View className="mb-6">
            <Text variant="h5" weight="semibold" className="text-primary mb-3">
              {t`Examples`}
            </Text>
            <Text variant="caption" className="text-foreground mb-2">
              {t`Tap the speaker icon to hear pronunciation`}
            </Text>
            {examples.map((example, index) => {
              const hasAudio = !!example.audio_url
              const ExampleWrapper = hasAudio ? Pressable : View

              return (
                <ExampleWrapper
                  key={index}
                  {...(hasAudio
                    ? {
                        onPress: () => handlePlayAudio(example.audio_url!),
                      }
                    : {})}
                >
                  <Card className="bg-background-tertiary mb-3 flex-row items-center p-4">
                    <View className="flex-1">
                      <Text variant="h6" weight="bold" className="text-primary">
                        {example.kbp}
                      </Text>
                      <Text variant="body" className="text-foreground mt-1">
                        {example.en}
                      </Text>
                      {example.pronunciation && (
                        <Text variant="caption" className="text-foreground-secondary mt-1 italic">
                          [{example.pronunciation}]
                        </Text>
                      )}
                    </View>
                    {hasAudio && (
                      <View className="ml-3">
                        <SpeakerHighIcon size={24} weight="fill" className="text-primary" />
                      </View>
                    )}
                  </Card>
                </ExampleWrapper>
              )
            })}
          </View>
        )}

        {/* Add some bottom padding */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Continue Button */}
      <View className="border-border bg-card border-t px-6 py-4">
        <Button variant="primary" onPress={onContinue} className="w-full">
          <Text variant="body" weight="bold" className="text-white">
            {t`Continue`}
          </Text>
        </Button>
      </View>
    </View>
  )
}

export default ContentStep
