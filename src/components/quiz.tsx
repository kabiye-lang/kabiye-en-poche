import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'

import { useLocalSearchParams } from 'expo-router'

import { XIcon } from 'phosphor-react-native'

import { Button, Card, Text, View } from '@/components/ui'
import { useAppQuizQuestions } from '@/hooks/use-app-data'

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

  const lessonId = id as string
  const { data: quizQuestions, isLoading, error } = useAppQuizQuestions(lessonId)

  useEffect(() => {
    setSelectedAnswer(null)
    setShowFeedback(false)
  }, [currentQuestionIndex])

  if (!id) {
    return null
  }

  if (isLoading) {
    return (
      <View className="mb-0 mt-auto flex-1 rounded-xl bg-white dark:bg-gray-800">
        <View className="flex-row items-center border-b border-gray-300 p-4 dark:border-gray-600">
          <TouchableOpacity onPress={onClose}>
            <XIcon size={24} className="text-text-dark dark:text-gray-100" />
          </TouchableOpacity>
          <Text variant="h3" weight="bold" className="ml-5">
            Quiz
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="mt-4">Loading quiz...</Text>
        </View>
      </View>
    )
  }

  if (error || !quizQuestions || quizQuestions.length === 0) {
    return (
      <View className="mb-0 mt-auto flex-1 rounded-xl bg-white dark:bg-gray-800">
        <View className="flex-row items-center border-b border-gray-300 p-4 dark:border-gray-600">
          <TouchableOpacity onPress={onClose}>
            <XIcon size={24} className="text-text-dark dark:text-gray-100" />
          </TouchableOpacity>
          <Text variant="h3" weight="bold" className="ml-5">
            Quiz
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text variant="h6" className="text-center text-text-dark dark:text-gray-100">
            No quiz available for this lesson
          </Text>
        </View>
      </View>
    )
  }

  const currentQuestion: Question | null =
    quizQuestions && quizQuestions.length > 0
      ? {
          type: quizQuestions[currentQuestionIndex].question_type,
          question: quizQuestions[currentQuestionIndex].question_en, // Use English for now
          correctAnswer: quizQuestions[currentQuestionIndex].correct_answer,
          answers: quizQuestions[currentQuestionIndex].options_en as string[],
          audioUri: quizQuestions[currentQuestionIndex].audio_url || undefined,
        }
      : null

  const handleAnswerPress = (answer: string) => {
    if (!currentQuestion) return
    setSelectedAnswer(answer)
    setShowFeedback(true)
    if (answer === currentQuestion.correctAnswer) {
      setScore(score + 1)
    }
  }

  const handleNextPress = () => {
    setShowFeedback(false)
    setSelectedAnswer(null)
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowFeedback(true)
    }
  }

  const renderQuestion = () => {
    if (!currentQuestion) return null
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return currentQuestion.answers!.map((answer, index) => (
          <TouchableOpacity
            key={index}
            className={`mt-2.5 rounded-xl p-4 ${selectedAnswer === answer ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-700'}`}
            onPress={() => handleAnswerPress(answer)}
            disabled={showFeedback}
          >
            <Text variant="lg" className="text-text-dark dark:text-gray-100">
              {answer}
            </Text>
          </TouchableOpacity>
        ))
      case 'true-false':
        return ['True', 'False'].map((answer, index) => (
          <TouchableOpacity
            key={index}
            className={`mt-2.5 rounded-xl p-4 ${selectedAnswer === answer ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-700'}`}
            onPress={() => handleAnswerPress(answer)}
            disabled={showFeedback}
          >
            <Text variant="lg" className="text-text-dark dark:text-gray-100">
              {answer}
            </Text>
          </TouchableOpacity>
        ))
      case 'fill-in-the-blank':
        return (
          <View>
            <Text variant="lg" className="mb-2.5 text-text-dark dark:text-gray-100">
              {currentQuestion?.prompt}
            </Text>
            {currentQuestion?.answers!.map((answer, index) => (
              <TouchableOpacity
                key={index}
                className={`mt-2.5 rounded-xl p-4 ${selectedAnswer === answer ? 'bg-secondary' : 'bg-gray-200'}`}
                onPress={() => handleAnswerPress(answer)}
                disabled={showFeedback}
              >
                <Text variant="lg" className="text-text-dark dark:text-gray-100">
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
    <View className="mb-0 mt-auto flex-1 rounded-xl bg-white dark:bg-gray-800">
      <View className="flex-row items-center border-b border-gray-300 p-4 dark:border-gray-600">
        <TouchableOpacity onPress={onClose}>
          <XIcon size={24} className="text-text-dark dark:text-gray-100" />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" className="ml-5">
          Quiz
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingVertical: 20, paddingHorizontal: 10 }}>
        <View flex className="px-2.5 pt-5">
          <Card className="mb-5 p-5">
            <Text variant="h3" weight="bold" className="mb-2.5 text-text-dark dark:text-gray-100">
              {currentQuestion?.question}
            </Text>
            {renderQuestion()}
          </Card>
          {showFeedback && (
            <View className="mt-5 items-center">
              <Text variant="h3" weight="bold" className="mb-5 text-primary">
                {selectedAnswer === currentQuestion?.correctAnswer
                  ? 'Correct!'
                  : `Incorrect! The correct answer is ${currentQuestion?.correctAnswer}.`}
              </Text>
              {currentQuestionIndex < quizQuestions.length - 1 ? (
                <Button variant="primary" onPress={handleNextPress}>
                  Next
                </Button>
              ) : (
                <Text variant="h3" weight="bold" className="text-secondary">
                  Quiz finished! Your score is {score} out of {quizQuestions.length}.
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
