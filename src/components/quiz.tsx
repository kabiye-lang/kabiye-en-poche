import React, { useEffect, useState } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import { XIcon } from 'phosphor-react-native'

import { Button, Card, Text, View } from '@/components/ui'
import { quizContents } from '@/utils/units'

import ListenChose from './listen-chose'
import ListenType from './listen-type'
import MatchPairs from './match-pairs'
import OrderWords from './order-words'

interface QuizModalProps {
  onClose: () => void
}

interface Question {
  type: string
  question: string
  correctAnswer: string
  words?: string[]
  answers?: string[]
  options?: string[]
  pairs?: [string, string][]
  prompt?: string
  audioUri?: string
}

const QuizModal: React.FC<QuizModalProps> = ({ onClose }) => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  // @ts-expect-error id undefined
  const quiz = quizContents[id]

  useEffect(() => {
    setSelectedAnswer(null)
    setShowFeedback(false)
  }, [currentQuestionIndex])

  if (!id) {
    return
  }
  const currentQuestion: Question = quiz.questions[currentQuestionIndex]

  const handleAnswerPress = (answer: string) => {
    setSelectedAnswer(answer)
    setShowFeedback(true)
    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNextPress = () => {
    setShowFeedback(false)
    setSelectedAnswer(null)
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowFeedback(true)
    }
  }

  const renderQuestion = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return currentQuestion.answers!.map((answer, index) => (
          <TouchableOpacity
            key={index}
            className={`mt-2.5 rounded-xl p-4 ${selectedAnswer === answer ? 'bg-secondary' : 'bg-gray-200'}`}
            onPress={() => handleAnswerPress(answer)}
            disabled={showFeedback}
          >
            <Text variant="lg" color="dark">
              {answer}
            </Text>
          </TouchableOpacity>
        ))
      case 'true-false':
        return ['True', 'False'].map((answer, index) => (
          <TouchableOpacity
            key={index}
            className={`mt-2.5 rounded-xl p-4 ${selectedAnswer === answer ? 'bg-secondary' : 'bg-gray-200'}`}
            onPress={() => handleAnswerPress(answer)}
            disabled={showFeedback}
          >
            <Text variant="lg" color="dark">
              {answer}
            </Text>
          </TouchableOpacity>
        ))
      case 'fill-in-the-blank':
        return (
          <View>
            <Text variant="lg" color="dark" className="mb-2.5">
              {currentQuestion.prompt}
            </Text>
            {currentQuestion.answers!.map((answer, index) => (
              <TouchableOpacity
                key={index}
                className={`mt-2.5 rounded-xl p-4 ${selectedAnswer === answer ? 'bg-secondary' : 'bg-gray-200'}`}
                onPress={() => handleAnswerPress(answer)}
                disabled={showFeedback}
              >
                <Text variant="lg" color="dark">
                  {answer}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      case 'match-pairs':
        return (
          // @ts-expect-error question type
          <MatchPairs question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      case 'order-words':
        return (
          // @ts-expect-error question type
          <OrderWords question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      case 'listen-type':
        return (
          // @ts-expect-error question type
          <ListenType question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      case 'listen-chose':
        return (
          // @ts-expect-error question type
          <ListenChose question={currentQuestion} onAnswerSelected={handleAnswerPress} showFeedback={showFeedback} />
        )
      default:
        return null
    }
  }

  return (
    <View className="mb-0 mt-auto flex-1 rounded-xl bg-white">
      <View className="flex-row items-center border-b border-gray-300 p-4">
        <TouchableOpacity onPress={onClose}>
          <XIcon size={24} color="black" />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" className="ml-5">
          Quiz
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex className="px-2.5 pt-5">
          <Card variant="elevated" className="mb-5 p-5">
            <Text variant="h3" weight="bold" color="dark" className="mb-2.5">
              {currentQuestion.question}
            </Text>
            {renderQuestion()}
          </Card>
          {showFeedback && (
            <View className="mt-5 items-center">
              <Text variant="h3" weight="bold" color="primary" className="mb-5">
                {selectedAnswer === currentQuestion.correctAnswer
                  ? 'Correct!'
                  : `Incorrect! The correct answer is ${currentQuestion.correctAnswer}.`}
              </Text>
              {currentQuestionIndex < quiz.questions.length - 1 ? (
                <Button variant="primary" onPress={handleNextPress}>
                  Next
                </Button>
              ) : (
                <Text variant="h3" weight="bold" color="secondary">
                  Quiz finished! Your score is {score} out of {quiz.questions.length}.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default QuizModal
