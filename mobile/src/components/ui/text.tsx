import type { VariantProps } from 'tailwind-variants'

import React from 'react'
import { Text as RNText, TextProps as RNTextProps } from 'react-native'

import { tv } from 'tailwind-variants'

import { cn } from '../../utils/cn'
import { childrenNeedKabiyeFace } from '../../utils/kabiye-script'

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
    center: {
      true: 'text-center',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'body',
    center: false,
  },
})

/**
 * Andika ships Regular and Bold only, so Figtree's eight weights collapse onto two.
 * Semibold and up read as bold; everything lighter reads as regular.
 */
const KABIYE_FACE_FOR = {
  regular: 'font-kbp-regular',
  bold: 'font-kbp-bold',
  italic: 'font-kbp-italic',
  boldItalic: 'font-kbp-bold-italic',
} as const

const BOLD_FIGTREE = /font-fig-(semibold|bold|extrabold|black)\b/
const ITALIC_FIGTREE = /font-fig-[a-z]+-italic\b/
const ANY_FIGTREE = /\bfont-fig-[a-z-]+/g

/** Swap the interface face for the Kabiyè one, preserving apparent weight and slant. */
function toKabiyeFace(classes: string): string {
  const bold = BOLD_FIGTREE.test(classes)
  const italic = ITALIC_FIGTREE.test(classes) || /\bitalic\b/.test(classes)
  const face = bold
    ? italic
      ? KABIYE_FACE_FOR.boldItalic
      : KABIYE_FACE_FOR.bold
    : italic
      ? KABIYE_FACE_FOR.italic
      : KABIYE_FACE_FOR.regular

  return `${classes.replace(ANY_FIGTREE, '').trim()} ${face}`.replace(/\s+/g, ' ').trim()
}

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {
  className?: string
  /**
   * Force the Kabiyè face on or off. Leave unset: the content decides, which is right
   * almost everywhere. Set it `true` for Kabiyè that happens to use only letters the
   * interface face can draw (`pili`, `caa`) and still needs to match the words beside it.
   */
  kabiye?: boolean
}

export function Text({ variant, weight, center, className, children, kabiye, ...props }: TextProps) {
  const base = cn(textVariants({ variant, weight, center }), className)
  const useKabiyeFace = kabiye ?? childrenNeedKabiyeFace(children)
  const textClassName = useKabiyeFace ? toKabiyeFace(base) : base

  return (
    <RNText className={textClassName} {...props}>
      {children}
    </RNText>
  )
}
