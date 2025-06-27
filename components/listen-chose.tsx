import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import { Button, Colors, View } from 'react-native-ui-lib'

import { Audio } from 'expo-av'

import { SpeakerHighIcon } from 'phosphor-react-native'

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
  const [_sound, setSound] = useState<Audio.Sound | null>(null)
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([])
  const shakeAnimation = useRef(new Animated.Value(0)).current
  const soundRef = useRef<Audio.Sound | null>(null)

  useEffect(() => {
    setShuffledOptions(shuffleArray([...question.options]))
  }, [question.options])

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
    if (selectedAnswer === null) return

    onAnswerSelected(selectedAnswer)
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
    if (selectedAnswer !== question.correctAnswer) {
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
    <View>
      <Button onPress={replayAudio} backgroundColor={Colors.secondary}>
        <SpeakerHighIcon size={20} color={Colors.white} />
        <Text style={styles.replayText}>Replay Audio</Text>
      </Button>
      <Animated.View style={[styles.optionsWrapper, { transform: [{ translateX: shakeAnimation }] }]}>
        <View style={styles.phraseWrapper}>
          {shuffledOptions.map((option, index) => (
            <Button
              key={index}
              label={option}
              outline={selectedAnswer !== option}
              margin-5
              onPress={() => setSelectedAnswer(option)}
              disabled={showFeedback}
            />
          ))}
        </View>
      </Animated.View>
      <Button
        label="Validate"
        onPress={validateAnswer}
        backgroundColor={Colors.primary}
        style={styles.validateButton}
        disabled={showFeedback}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  optionsWrapper: {
    marginTop: 10,
    marginBottom: 20,
  },
  phraseWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  replayText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  validateButton: {
    marginTop: 10,
  },
})

export default ListenChose
