import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { useLingui } from '@lingui/react/macro'
import { SpeakerHighIcon, SpeakerSlashIcon } from 'phosphor-react-native'

import { Button, Card, Text, View } from '@/components/ui'
import { useAudio } from '@/hooks/use-audio'

interface ListenChooseStepProps {
  question: string
  options: string[]
  correctAnswer: string
  audioUrl?: string
  onAnswer: (isCorrect: boolean, answer: string) => void
}

const ListenChooseStep = ({ question, options, correctAnswer, audioUrl, onAnswer }: ListenChooseStepProps) => {
  const { t } = useLingui()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const { playAudio, stopAudio, isPlaying, isLoading } = useAudio()

  // Auto-play audio when component mounts
  useEffect(() => {
    if (audioUrl) {
      playAudio(audioUrl)
    }

    // Cleanup on unmount
    return () => {
      stopAudio()
    }
  }, [audioUrl])

  const handleSelectAnswer = (index: number) => {
    if (showFeedback) return
    setSelectedIndex(index)
    // Show instant feedback
    setShowFeedback(true)
  }

  const handleContinue = () => {
    if (selectedIndex === null) return
    const isCorrect = selectedIndex.toString() === correctAnswer
    const selectedAnswer = options[selectedIndex]
    stopAudio() // Stop audio when moving to next step
    onAnswer(isCorrect, selectedAnswer)
  }

  const handleToggleAudio = async () => {
    if (!audioUrl) return

    if (isPlaying) {
      await stopAudio()
    } else {
      await playAudio(audioUrl)
    }
  }

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Question with Audio */}
        <Card className="mb-6 p-6">
          <Text variant="h5" weight="semibold" className="mb-4 text-center text-text-dark dark:text-gray-100">
            {question}
          </Text>

          {/* Audio Player */}
          <View className="items-center py-4">
            <TouchableOpacity
              onPress={handleToggleAudio}
              disabled={!audioUrl || isLoading}
              className={`h-20 w-20 items-center justify-center rounded-full shadow-lg ${
                !audioUrl ? 'bg-gray-300' : isPlaying ? 'bg-green-500' : 'bg-primary'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="large" color="white" />
              ) : isPlaying ? (
                <SpeakerHighIcon size={40} color="white" weight="fill" />
              ) : (
                <SpeakerSlashIcon size={40} color="white" weight="fill" />
              )}
            </TouchableOpacity>
            <Text variant="caption" className="mt-2 text-center text-text-grey dark:text-gray-400">
              {!audioUrl
                ? t`No audio available`
                : isLoading
                  ? t`Loading audio...`
                  : isPlaying
                    ? t`Playing... (Tap to stop)`
                    : t`Tap to listen`}
            </Text>
          </View>
        </Card>

        {/* Options */}
        <View className="mb-4 gap-3">
          {options.map((option, index) => {
            const isSelected = selectedIndex === index
            const isCorrect = index.toString() === correctAnswer
            const showCorrect = showFeedback && isCorrect
            const showIncorrect = showFeedback && isSelected && !isCorrect

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectAnswer(index)}
                disabled={showFeedback}
                className={`rounded-xl border-2 p-4 ${
                  showCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : showIncorrect
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <View className="flex-row items-center">
                  {/* Radio Button */}
                  <View
                    className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
                      showCorrect
                        ? 'border-green-500 bg-green-500'
                        : showIncorrect
                          ? 'border-red-500 bg-red-500'
                          : isSelected
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {(isSelected || showCorrect) && <View className="h-3 w-3 rounded-full bg-white" />}
                  </View>

                  {/* Option Text */}
                  <Text
                    variant="h6"
                    weight="bold"
                    className={`flex-1 ${
                      showCorrect
                        ? 'text-green-700 dark:text-green-300'
                        : showIncorrect
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-text-dark dark:text-gray-100'
                    }`}
                  >
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Feedback */}
        {showFeedback && (
          <Card
            className={`mb-4 p-4 ${
              selectedIndex?.toString() === correctAnswer
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <Text
              variant="h6"
              weight="bold"
              className={`${
                selectedIndex?.toString() === correctAnswer
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}
            >
              {selectedIndex?.toString() === correctAnswer ? t`Correct! 🎉` : t`Not quite right`}
            </Text>
          </Card>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Button */}
      <View className="border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        {showFeedback && (
          <Button variant="primary" onPress={handleContinue} className="w-full">
            <Text variant="body" weight="bold" className="text-white">
              {t`Continue`}
            </Text>
          </Button>
        )}
      </View>
    </View>
  )
}

export default ListenChooseStep
