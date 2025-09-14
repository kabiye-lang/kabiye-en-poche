import React, { useEffect, useRef, useState } from 'react'
import { Animated, TextInput, TouchableOpacity } from 'react-native'

import { Audio } from 'expo-av'

import { SpeakerHighIcon } from 'phosphor-react-native'

import { Button, Text, View } from '@/components/ui'

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
  const [, setSound] = useState<Audio.Sound | null>(null)
  const shakeAnimation = useRef(new Animated.Value(0)).current
  const soundRef = useRef<Audio.Sound | null>(null)

  useEffect(() => {
    const playAudio = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync()
        }
        const { sound } = await Audio.Sound.createAsync({ uri: question.audioUri })
        soundRef.current = sound
        setSound(sound)
        await sound.playAsync()
      } catch (error) {
        console.error('Error playing audio:', error)
      }
    }

    playAudio()

    return () => {
      if (soundRef.current) {
        soundRef.current
          .stopAsync()
          .then(() => soundRef.current?.unloadAsync())
          .catch((error) => {
            console.error('Error unloading sound:', error)
          })
      }
    }
  }, [question.audioUri])

  const validateAnswer = async () => {
    onAnswerSelected(typedAnswer)
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
        setSound(null)
      } catch (error) {
        console.error('Error stopping or unloading sound:', error)
      }
    }
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

  const replayAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync()
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: question.audioUri })
        soundRef.current = newSound
        setSound(newSound)
        await newSound.playAsync()
      }
    } catch (error) {
      console.error('Error replaying audio:', error)
    }
  }

  return (
    <View className="p-5">
      <TouchableOpacity onPress={replayAudio} className="my-2.5 flex-row items-center rounded-md bg-green-500 p-2.5">
        <SpeakerHighIcon size={24} color="#FFFFFF" />
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
