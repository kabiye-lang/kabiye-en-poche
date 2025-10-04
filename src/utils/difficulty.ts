import type { DifficultyLevel } from '@/types/supabase'

import { msg } from '@lingui/core/macro'

import i18n from '@/i18n'

// Define message descriptors for difficulty levels
export const difficultyMessages = {
  beginner: msg`Beginner`,
  intermediate: msg`Intermediate`,
  advanced: msg`Advanced`,
}

/**
 * Get translated difficulty label
 * @param difficulty - The difficulty level from database
 * @returns Translated difficulty label
 */
export function getDifficultyLabel(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'beginner':
      return i18n._(difficultyMessages.beginner)
    case 'intermediate':
      return i18n._(difficultyMessages.intermediate)
    case 'advanced':
      return i18n._(difficultyMessages.advanced)
    default:
      return difficulty
  }
}

/**
 * Get difficulty color for UI
 * @param difficulty - The difficulty level from database
 * @returns Color string for the difficulty level
 */
export function getDifficultyColor(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'beginner':
      return '#4CAF50' // Green
    case 'intermediate':
      return '#FF9800' // Orange
    case 'advanced':
      return '#F44336' // Red
    default:
      return '#6B7280' // Gray
  }
}

/**
 * Get difficulty background color class for NativeWind
 * @param difficulty - The difficulty level from database
 * @returns NativeWind class string
 */
export function getDifficultyBgClass(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 dark:bg-green-900/30'
    case 'intermediate':
      return 'bg-yellow-100 dark:bg-yellow-900/30'
    case 'advanced':
      return 'bg-red-100 dark:bg-red-900/30'
    default:
      return 'bg-gray-100 dark:bg-gray-900/30'
  }
}

/**
 * Get difficulty text color class for NativeWind
 * @param difficulty - The difficulty level from database
 * @returns NativeWind class string
 */
export function getDifficultyTextClass(difficulty: DifficultyLevel): string {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-600 dark:text-green-400'
    case 'intermediate':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'advanced':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}
