import type { ClassValue } from 'clsx'

import { clsx } from 'clsx'

/**
 * Utility function to merge Uniwind classes conditionally
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
