import type { DifficultyLevel } from '../types/supabase'

import { msg } from '@lingui/core/macro'

import i18n from '../i18n'

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
      return 'bg-difficulty-beginner-bg'
    case 'intermediate':
      return 'bg-difficulty-intermediate-bg'
    case 'advanced':
      return 'bg-difficulty-advanced-bg'
    default:
      return 'bg-difficulty-default-bg'
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
      return 'text-difficulty-beginner-text'
    case 'intermediate':
      return 'text-difficulty-intermediate-text'
    case 'advanced':
      return 'text-difficulty-advanced-text'
    default:
      return 'text-difficulty-default-text'
  }
}
