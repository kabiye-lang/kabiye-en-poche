export const units = [
  {
    id: 1,
    name: 'Introduction to Kabiyè',
    description: 'Basic introduction to the Kabiyè language, including alphabet and greetings.',
  },
  { id: 2, name: 'Everyday Conversations', description: 'Essential vocabulary and phrases for daily interactions.' },
  {
    id: 3,
    name: 'Food and Cooking',
    description: 'Learn about food ingredients, meals, and cooking techniques in Kabiyè.',
  },
  {
    id: 4,
    name: 'Travel and Directions',
    description: 'Essential phrases and vocabulary for travel and asking for directions.',
  },
]

export const lessons = {
  1: [
    {
      id: 1,
      name: 'The Kabiyè Alphabet',
      description: 'Learn the 33 letters of the Kabiyè alphabet, each representing a distinct sound.',
    },
    { id: 2, name: 'Greetings', description: 'Common greetings in Kabiyè and their appropriate usage.' },
    {
      id: 3,
      name: 'Introducing Oneself',
      description: 'Phrases for self-introduction and asking about others in Kabiyè.',
    },
    {
      id: 4,
      name: "Presenting One's Family",
      description: 'Vocabulary for family members and phrases to introduce them.',
    },
  ],
  2: [
    {
      id: 5,
      name: 'Buying Essential Items',
      description: 'Vocabulary and phrases for shopping and bargaining in Kabiyè.',
    },
    {
      id: 6,
      name: 'Asking for Directions',
      description: 'Essential phrases for asking for and giving directions in Kabiyè.',
    },
    {
      id: 7,
      name: 'Making Small Talk',
      description: 'Making small talk in Kabiyè, including common questions and answers.',
    },
  ],
  3: [
    { id: 8, name: 'Common Food Items', description: 'Names of common food items in Kabiyè.' },
    { id: 9, name: 'Traditional Recipes', description: 'Traditional Kabiyè recipes and cooking techniques.' },
    { id: 10, name: 'Ordering in a Restaurant', description: 'Phrases for ordering food in a restaurant in Kabiyè.' },
  ],
  4: [
    {
      id: 11,
      name: 'Using Public Transport',
      description: 'Using public transport and understanding transport-related phrases in Kabiyè.',
    },
    { id: 12, name: 'Booking Accommodations', description: 'Booking accommodations and related phrases in Kabiyè.' },
    { id: 13, name: 'Emergency Phrases', description: 'Essential emergency phrases in Kabiyè.' },
  ],
}

export const lessonContents = {
  1: {
    title: 'The Kabiyè Alphabet',
    content:
      'Learn the 33 letters of the Kabiyè alphabet, each representing a distinct sound. Practice writing and pronunciation.',
    examples: ['Example 1: A - pronounced as "ah"', 'Example 2: B - pronounced as "beh"'],
    image: 'https://via.placeholder.com/300',
    audio: null,
    quiz: true,
  },
  2: {
    title: 'Greetings',
    content:
      'Common greetings in Kabiyè and their appropriate usage. Practice saying hello, good morning, and other greetings.',
    examples: ['Example 1: Hello - "Ndi"', 'Example 2: Good morning - "Ndi nyusu"'],
    image: 'https://via.placeholder.com/300',
    audio: 'https://example.com/audio/greetings.mp3',
    quiz: true,
  },
  3: {
    title: 'Introducing Oneself',
    content:
      'Phrases for self-introduction and asking about others in Kabiyè. Practice introducing yourself and asking others about their names.',
    examples: ['Example 1: My name is - "N sari"', 'Example 2: What is your name? - "N sari yi?"'],
    image: 'https://via.placeholder.com/300',
    audio: 'https://example.com/audio/introducing.mp3',
    quiz: true,
  },
  4: {
    title: "Presenting One's Family",
    content:
      'Vocabulary for family members and phrases to introduce them. Practice talking about your family and their roles.',
    examples: ['Example 1: Mother - "N ma"', 'Example 2: Father - "N ba"'],
    image: 'https://via.placeholder.com/300',
    audio: null,
    quiz: true,
  },
  // Add more lesson contents as needed
}
export const quizContents = {
  '1': {
    questions: [
      {
        type: 'multiple-choice',
        question: 'What is the capital of France?',
        answers: ['Paris', 'London', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris',
      },
      {
        type: 'true-false',
        question: 'The sky is blue.',
        correctAnswer: 'True',
      },
      {
        type: 'fill-in-the-blank',
        question: 'The capital of Spain is ______.',
        prompt: 'The capital of Spain is ______.',
        correctAnswer: 'Madrid',
        answers: ['Hello', 'Hi', 'Hey', 'Greetings'],
      },
      {
        type: 'match-pairs',
        question: 'Match the countries with their capitals.',
        pairs: [
          ['France', 'Paris'],
          ['Germany', 'Berlin'],
          ['Spain', 'Madrid'],
          ['Italy', 'Rome'],
        ],
        correctAnswer: 'Correct',
      },
      {
        type: 'order-words',
        question: 'Order the words to form a correct sentence.',
        words: ['to', 'the', 'park', 'I', 'am', 'going'],
        correctAnswer: 'I am going to the park',
      },
      {
        type: 'listen-type',
        question: 'Listen to the audio and type what you hear.',
        // audioUri: 'https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3',
        audioUri: 'https://onlinetestcase.com/wp-content/uploads/2023/06/100-KB-MP3.mp3',
        correctAnswer: 'Hello',
      },
      {
        type: 'listen-chose',
        question: 'Listen to the audio and choose the correct answer.',
        audioUri: 'https://onlinetestcase.com/wp-content/uploads/2023/06/100-KB-MP3.mp3',
        correctAnswer: 'Hello',
        options: ['Hello', 'Hi', 'Hey', 'Greetings'],
      },
    ],
  },
}
