import type { VariantProps } from 'tailwind-variants'

import React from 'react'
import { TouchableOpacity } from 'react-native'

import { tv } from 'tailwind-variants'

import { cn } from '@/utils/cn'

import { Text } from './text'
import { View, ViewProps } from './view'

const cardVariants = tv({
  base: 'rounded-xl',
  variants: {
    variant: {
      default: 'shadow-card bg-white dark:bg-gray-800 dark:shadow-none',
      elevated: 'shadow-card-lg bg-white dark:bg-gray-800 dark:shadow-none',
      outlined: 'border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
      filled: 'bg-gray-50 dark:bg-gray-700',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
  },
})

export interface CardProps extends ViewProps, VariantProps<typeof cardVariants> {
  backgroundColor?: string
  onPress?: () => void
  children: React.ReactNode
}

export function Card({ variant, padding, backgroundColor, onPress, children, className, ...props }: CardProps) {
  const cardClassName = cn(cardVariants({ variant, padding }), className)
  const cardStyle = backgroundColor ? { backgroundColor } : undefined

  if (onPress) {
    const { onBlur, onFocus, ...touchableProps } = props as any
    return (
      <TouchableOpacity className={cardClassName} style={cardStyle} onPress={onPress} {...touchableProps}>
        {children}
      </TouchableOpacity>
    )
  }

  return (
    <View className={cardClassName} style={cardStyle} {...props}>
      {children}
    </View>
  )
}

export interface CardHeaderProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <View className={cn('mb-4 flex-row items-start justify-between', className)}>
      <View className="flex-1">
        {title && (
          <Text variant="h6" weight="semibold" className="mb-1">
            {title}
          </Text>
        )}
        {subtitle && (
          <Text variant="body" className="text-text-grey dark:text-gray-400">
            {subtitle}
          </Text>
        )}
      </View>
      {action && <View>{action}</View>}
    </View>
  )
}

export interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return <View className={cn(className)}>{children}</View>
}

export interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <View className={cn('mt-4', className)}>{children}</View>
}
