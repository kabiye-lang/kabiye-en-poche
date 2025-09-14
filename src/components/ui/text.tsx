import type { VariantProps } from 'tailwind-variants'

import React from 'react'
import { Text as RNText, TextProps as RNTextProps } from 'react-native'

import { tv } from 'tailwind-variants'

import { cn } from '@/utils/cn'

const textVariants = tv({
  base: 'font-fig-regular',
  variants: {
    variant: {
      h1: 'font-fig-bold text-6xl',
      h2: 'font-fig-bold text-5xl',
      h3: 'font-fig-bold text-4xl',
      h4: 'font-fig-semibold text-3xl',
      h5: 'font-fig-semibold text-2xl',
      h6: 'font-fig-medium text-xl',
      lg: 'font-fig-regular text-lg',
      body: 'font-fig-regular text-base',
      caption: 'font-fig-regular text-sm',
      small: 'font-fig-regular text-xs',
    },
    weight: {
      thin: 'font-fig-light',
      light: 'font-fig-light',
      regular: 'font-fig-regular',
      medium: 'font-fig-medium',
      semibold: 'font-fig-semibold',
      bold: 'font-fig-bold',
      extrabold: 'font-fig-extrabold',
      black: 'font-fig-black',
    },
    color: {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      dark: 'text-text-dark',
      light: 'text-text-light',
      grey: 'text-text-grey',
      white: 'text-white',
      grapheme: 'text-grapheme',
      vowel: 'text-vowel',
      consonant: 'text-consonant',
      indication: 'text-indication',
    },
    center: {
      true: 'text-center',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'dark',
    center: false,
  },
})

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string
}

export function Text({ variant, weight, color, center, className, children, ...props }: TextProps) {
  const textClassName = cn(textVariants({ variant, weight, color, center }), className)

  return (
    <RNText className={textClassName} {...props}>
      {children}
    </RNText>
  )
}
