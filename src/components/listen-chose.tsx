import { useEffect, useRef, useState } from 'react'
import { Animated } from 'react-native'

import { useAudioPlayer } from 'expo-audio'

import { SpeakerHighIcon } from 'phosphor-react-native'

import { Button, Text, View } from '@/components/ui'

interface ListenChoseProps {
  question: {
    audioUri: string
    correctAnswer: string
    options: string[]
  }
  onAnswerSelected: (_answer: string) => void
  showFeedback: boolean
}

const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const ListenChose: React.FC<ListenChoseProps> = ({ question, onAnswerSelected, showFeedback }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([])
  const shakeAnimation = useRef(new Animated.Value(0)).current

  // Create audio player for the question audio
  const player = useAudioPlayer({ uri: question.audioUri })

  useEffect(() => {
    setShuffledOptions(shuffleArray([...question.options]))
  }, [question.options])

  useEffect(() => {
    // Play audio when component mounts or audio URI changes
    player.play()
  }, [question.audioUri, player])

  const validateAnswer = async () => {
    if (selectedAnswer === null) return

    onAnswerSelected(selectedAnswer)

    // Stop the audio player
    player.pause()

    if (selectedAnswer !== question.correctAnswer) {
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
    <View>
      <Button variant="secondary" onPress={replayAudio} className="flex-row items-center">
        <SpeakerHighIcon size={20} color="#FFFFFF" />
        <Text variant="body" weight="bold" color="white" className="ml-1">
          Replay Audio
        </Text>
      </Button>
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }} className="mb-5 mt-2.5">
        <View className="my-2.5 flex-row flex-wrap">
          {shuffledOptions.map((option, index) => (
            <Button
              key={index}
              variant={selectedAnswer === option ? 'primary' : 'outline'}
              size="sm"
              className="m-1"
              onPress={() => setSelectedAnswer(option)}
              disabled={showFeedback}
            >
              {option}
            </Button>
          ))}
        </View>
      </Animated.View>
      <Button variant="primary" onPress={validateAnswer} disabled={showFeedback} className="mt-2.5">
        Validate
      </Button>
    </View>
  )
}

export default ListenChose
