import React from 'react'

import { LinearGradient } from 'expo-linear-gradient'

import { cn } from '../../utils/cn'
import { View, ViewProps } from './view'

export interface GradientProps extends Omit<ViewProps, 'direction'> {
  colors: [string, string, ...string[]]
  direction?: 'horizontal' | 'vertical' | 'diagonal' | 'diagonal-reverse'
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  children: React.ReactNode
}

const directionStyles = {
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  'diagonal-reverse': { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } },
}

export function Gradient({ colors, direction = 'vertical', start, end, children, className, ...props }: GradientProps) {
  const gradientProps = start && end ? { start, end } : directionStyles[direction]

  return (
    <View className={cn('overflow-hidden rounded-xl', className)} {...props}>
      <LinearGradient colors={colors} start={gradientProps.start} end={gradientProps.end} className="flex-1">
        {children}
      </LinearGradient>
    </View>
  )
}
