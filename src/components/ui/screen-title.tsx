import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Text } from './text'
import { View } from './view'

export interface ScreenTitleProps {
  title: string
  subtitle?: string
  fixed?: boolean
  className?: string
}

export function ScreenTitle({ title, subtitle, fixed = false, className = '' }: ScreenTitleProps) {
  const safeAreaInsets = useSafeAreaInsets()

  return (
    <View
      className={`pb-5 pt-10 ${fixed ? 'absolute left-0 right-0 top-0 z-10' : ''} ${className}`}
      style={{ paddingTop: 40 + safeAreaInsets.top }}
    >
      <Text variant="h1" weight="bold" className="mb-2 text-text-dark dark:text-gray-100">
        {title}
      </Text>
      {subtitle && (
        <Text variant="body" className="text-text-grey dark:text-gray-200">
          {subtitle}
        </Text>
      )}
    </View>
  )
}
