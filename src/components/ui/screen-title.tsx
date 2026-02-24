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
      className={`pt-10 pb-5 ${fixed ? 'absolute top-0 right-0 left-0 z-10' : ''} ${className}`}
      style={{ paddingTop: 40 + safeAreaInsets.top }}
    >
      <Text variant="h1" weight="bold" className="text-foreground mb-2">
        {title}
      </Text>
      {subtitle && (
        <Text variant="body" className="text-foreground-secondary">
          {subtitle}
        </Text>
      )}
    </View>
  )
}
