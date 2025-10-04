import { ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'
import { SpeakerHighIcon } from 'phosphor-react-native'

import { Button, Card, Text, View } from '@/components/ui'
import { useAudio } from '@/hooks/use-audio'
import { getDifficultyBgClass, getDifficultyLabel, getDifficultyTextClass } from '@/utils/difficulty'

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
  examples?: any // Raw examples from database
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
      ? rawExamples.map((ex: any) => ({
          kbp: ex.kbp || '',
          en: ex.en || '',
          fr: ex.fr || '',
          pronunciation: ex.pronunciation,
          audio_url: ex.audio_url,
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
          <View className="mb-6 mt-4">
            {title && (
              <Text variant="h3" weight="bold" className="mb-2 text-primary">
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
          <Text variant="h6" weight="bold" className="mb-4 text-text-dark dark:text-gray-100">
            {title}
          </Text>
          <Text variant="lg" className="leading-7 text-text-dark dark:text-gray-100">
            {content}
          </Text>
        </Card>

        {/* Examples */}
        {examples && examples.length > 0 && (
          <View className="mb-6">
            <Text variant="h5" weight="semibold" className="mb-3 text-primary">
              {t`Examples`}
            </Text>
            <Text variant="caption" className="mb-2 text-text-grey dark:text-gray-400">
              {t`Tap the speaker icon to hear pronunciation`}
            </Text>
            {examples.map((example, index) => {
              const hasAudio = !!example.audio_url
              const ExampleWrapper = hasAudio ? TouchableOpacity : View

              return (
                <ExampleWrapper
                  key={index}
                  {...(hasAudio
                    ? {
                        onPress: () => handlePlayAudio(example.audio_url!),
                        activeOpacity: 0.7,
                      }
                    : {})}
                >
                  <Card className="mb-3 flex-row items-center bg-bg-grey p-4 dark:bg-gray-700">
                    <View className="flex-1">
                      <Text variant="h6" weight="bold" className="text-primary">
                        {example.kbp}
                      </Text>
                      <Text variant="body" className="mt-1 text-text-grey dark:text-gray-400">
                        {example.en}
                      </Text>
                      {example.pronunciation && (
                        <Text variant="caption" className="mt-1 italic text-text-grey dark:text-gray-500">
                          [{example.pronunciation}]
                        </Text>
                      )}
                    </View>
                    {hasAudio && (
                      <View className="ml-3">
                        <SpeakerHighIcon size={24} weight="fill" color="#059669" />
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
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
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
