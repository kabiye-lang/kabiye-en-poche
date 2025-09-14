import type { VariantProps } from 'tailwind-variants'

import React from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'

import { tv } from 'tailwind-variants'

import { cn } from '@/utils/cn'

import { Text } from './text'

const buttonVariants = tv({
  base: 'flex-row items-center justify-center',
  variants: {
    variant: {
      primary: 'bg-primary active:bg-primary/90',
      secondary: 'bg-secondary active:bg-secondary/90',
      accent: 'bg-accent active:bg-accent/90',
      outline: 'border-2 border-primary bg-transparent active:bg-primary/10',
      ghost: 'bg-transparent active:bg-gray-100',
      link: 'bg-transparent active:bg-transparent',
    },
    size: {
      sm: 'rounded-md px-3 py-2',
      md: 'rounded-lg px-4 py-3',
      lg: 'rounded-lg px-6 py-4',
      xl: 'rounded-xl px-8 py-5',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
    disabled: {
      true: 'opacity-50',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    disabled: false,
  },
})

const textVariants = tv({
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-white',
      accent: 'text-white',
      outline: 'text-primary',
      ghost: 'text-primary',
      link: 'text-primary',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
  },
})

export interface ButtonProps extends TouchableOpacityProps, VariantProps<typeof buttonVariants> {
  loading?: boolean
  children: React.ReactNode
  className?: string
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const buttonClassName = cn(buttonVariants({ variant, size, fullWidth, disabled: disabled || loading }), className)

  const textClassName = cn(textVariants({ variant, size }))

  return (
    <TouchableOpacity className={buttonClassName} disabled={disabled || loading} {...props}>
      <Text weight="medium" className={textClassName}>
        {loading ? 'Loading...' : children}
      </Text>
    </TouchableOpacity>
  )
}
