import AsyncStorage from '@react-native-async-storage/async-storage'

const PROGRESS_KEY = 'user_progress'

export interface LocalProgress {
  lessonId: string
  completedAt: string
  score?: number
}

export const localProgressStorage = {
  // Get all progress
  async getAll(): Promise<LocalProgress[]> {
    try {
      const data = await AsyncStorage.getItem(PROGRESS_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error getting progress from storage:', error)
      return []
    }
  },

  // Get progress for a specific lesson
  async getLessonProgress(lessonId: string): Promise<LocalProgress | null> {
    try {
      const allProgress = await this.getAll()
      return allProgress.find((p) => p.lessonId === lessonId) || null
    } catch (error) {
      console.error('Error getting lesson progress:', error)
      return null
    }
  },

  // Save progress for a lesson
  async saveLessonProgress(lessonId: string, score?: number): Promise<void> {
    try {
      const allProgress = await this.getAll()
      const existingIndex = allProgress.findIndex((p) => p.lessonId === lessonId)

      const newProgress: LocalProgress = {
        lessonId,
        completedAt: new Date().toISOString(),
        score,
      }

      if (existingIndex >= 0) {
        allProgress[existingIndex] = newProgress
      } else {
        allProgress.push(newProgress)
      }

      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress))
    } catch (error) {
      console.error('Error saving lesson progress:', error)
      throw error
    }
  },

  // Remove progress for a lesson
  async removeLessonProgress(lessonId: string): Promise<void> {
    try {
      const allProgress = await this.getAll()
      const filteredProgress = allProgress.filter((p) => p.lessonId !== lessonId)
      await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(filteredProgress))
    } catch (error) {
      console.error('Error removing lesson progress:', error)
      throw error
    }
  },

  // Clear all progress
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROGRESS_KEY)
    } catch (error) {
      console.error('Error clearing all progress:', error)
      throw error
    }
  },

  // Get completed lesson IDs
  async getCompletedLessonIds(): Promise<string[]> {
    try {
      const allProgress = await this.getAll()
      return allProgress.map((p) => p.lessonId)
    } catch (error) {
      console.error('Error getting completed lesson IDs:', error)
      return []
    }
  },
}
