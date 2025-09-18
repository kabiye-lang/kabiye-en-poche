import { useEffect, useRef, useState } from 'react'
import { Animated, TextInput, TouchableOpacity } from 'react-native'

import { useAudioPlayer } from 'expo-audio'

import { SpeakerHighIcon } from 'phosphor-react-native'

import { Button, Text, View } from '@/components/ui'
import { brandColors } from '@/utils/design-system-nativewind'

interface ListenTypeProps {
  question: {
    audioUri: string
    correctAnswer: string
  }
  onAnswerSelected: (_answer: string) => void
  showFeedback: boolean
}

const ListenType: React.FC<ListenTypeProps> = ({ question, onAnswerSelected, showFeedback }) => {
  const [typedAnswer, setTypedAnswer] = useState<string>('')
  const [feedbackColor, setFeedbackColor] = useState<string>('#9CA3AF')
  const shakeAnimation = useRef(new Animated.Value(0)).current

  // Create audio player for the question audio
  const player = useAudioPlayer({ uri: question.audioUri })

  useEffect(() => {
    // Play audio when component mounts or audio URI changes
    player.play()
  }, [question.audioUri, player])

  const validateAnswer = async () => {
    onAnswerSelected(typedAnswer)

    // Stop the audio player
    player.pause()

    if (typedAnswer === question.correctAnswer) {
      setFeedbackColor('#10B981')
    } else {
      setFeedbackColor('#EF4444')
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start()
    }
  }

  const replayAudio = () => {
    // Reset to beginning and play
    player.seekTo(0)
    player.play()
  }

  return (
    <View className="p-5">
      <TouchableOpacity onPress={replayAudio} className="my-2.5 flex-row items-center rounded-md bg-green-500 p-2.5">
        <SpeakerHighIcon size={24} color={brandColors.textLight} />
        <Text variant="body" weight="bold" color="white" className="ml-1">
          Replay Audio
        </Text>
      </TouchableOpacity>
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }} className="mb-5 mt-2.5">
        <TextInput
          className="rounded-lg border p-4"
          style={{ borderColor: feedbackColor }}
          onChangeText={setTypedAnswer}
          value={typedAnswer}
          placeholder="Type your answer here"
          editable={!showFeedback}
        />
      </Animated.View>
      <Button variant="primary" onPress={validateAnswer} disabled={showFeedback} className="mt-2.5">
        Validate
      </Button>
    </View>
  )
}

export default ListenType
