import { ScrollView } from 'react-native'

import { useLingui } from '@lingui/react/macro'

import { Button, Card, Text, View } from '@/components/ui'

interface ContentStepProps {
  title?: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  content: string
  examples?: {
    kabiye: string
    translation: string
  }[]
  onContinue: () => void
}

const ContentStep = ({ title, difficulty, content, examples, onContinue }: ContentStepProps) => {
  const { t } = useLingui()

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 dark:text-green-400'
      case 'Intermediate':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'Advanced':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-primary'
    }
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Lesson Header */}
        {(title || difficulty) && (
          <View className="mb-6 mt-4">
            {title && (
              <Text variant="h3" weight="bold" className="mb-2 text-primary">
                {title}
              </Text>
            )}
            {difficulty && (
              <View className="flex-row items-center">
                <View
                  className={`rounded-full px-3 py-1 ${
                    difficulty === 'Beginner'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : difficulty === 'Intermediate'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                  }`}
                >
                  <Text variant="caption" weight="semibold" className={getDifficultyColor()}>
                    {difficulty}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Main Content */}
        <Card className="mb-4 p-6">
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
            {examples.map((example, index) => (
              <Card key={index} className="mb-3 flex-row items-center justify-between bg-bg-grey p-4 dark:bg-gray-700">
                <Text variant="h6" weight="bold" className="flex-1 text-primary">
                  {example.kabiye}
                </Text>
                <Text variant="body" className="ml-4 text-text-grey dark:text-gray-400">
                  {example.translation}
                </Text>
              </Card>
            ))}
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
