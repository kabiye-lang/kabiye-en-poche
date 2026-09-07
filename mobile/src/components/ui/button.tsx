import type { VariantProps } from 'tailwind-variants'

import React from 'react'
import { Pressable, PressableProps } from 'react-native'

import { Trans } from '@lingui/react/macro'
import { tv } from 'tailwind-variants'

import { cn } from '../../utils/cn'
import { Text } from './text'

const buttonVariants = tv({
  base: 'flex-row items-center justify-center',
  variants: {
    variant: {
      primary: 'bg-primary active:bg-primary/90',
      secondary: 'bg-secondary active:bg-secondary/90',
      accent: 'bg-accent active:bg-accent/90',
      outline: 'border-primary active:bg-primary/10 border-[1.5px] bg-transparent',
      ghost: 'active:bg-background-tertiary bg-transparent',
      link: 'bg-transparent active:bg-transparent',
    },
    // Every button in this system is a pill. Radius is not a per-button decision here:
    // pills are buttons, chips and the tab pill; 14-20px is for cards; 6-8px for keys.
    size: {
      sm: 'rounded-full px-[18px] py-3',
      md: 'rounded-full px-6 py-4',
      lg: 'rounded-full px-6 py-[18px]',
      xl: 'rounded-full px-8 py-5',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
    disabled: {
      // The direction's disabled state: the same ink button, held back. No grey fill --
      // grey is not in this palette, and a button that greys out reads as broken rather
      // than as not-yet.
      true: 'opacity-40',
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

export interface ButtonProps extends Omit<PressableProps, 'disabled'>, VariantProps<typeof buttonVariants> {
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
    // Without an explicit role every Button in the app reaches VoiceOver as a plain
    // group rather than a button. Both are defaults: `props` is spread after, so a
    // caller can still override either.
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: loading }}
      className={buttonClassName}
      disabled={disabled || loading}
      {...props}
    >
      <Text weight="medium" className={textClassName}>
        {loading ? <Trans>Loading…</Trans> : children}
      </Text>
    </Pressable>
  )
}
