import type { VariantProps } from 'tailwind-variants'

import React from 'react'
import { View as RNView, ViewProps as RNViewProps } from 'react-native'

import { tv } from 'tailwind-variants'

import { cn } from '@/utils/cn'

const viewVariants = tv({
  base: '',
  variants: {
    flex: {
      true: 'flex-1',
      false: '',
    },
    direction: {
      row: 'flex-row',
      column: 'flex-col',
      none: '',
    },
    center: {
      true: 'items-center justify-center',
      false: '',
    },
    centerX: {
      true: 'items-center',
      false: '',
    },
    centerY: {
      true: 'justify-center',
      false: '',
    },
    justify: {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    items: {
      start: 'items-start',
      end: 'items-end',
      center: 'items-center',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    wrap: {
      true: 'flex-wrap',
      false: '',
    },
  },
  defaultVariants: {
    flex: false,
    direction: 'none',
    center: false,
    centerX: false,
    centerY: false,
    wrap: false,
  },
})

export interface ViewProps extends RNViewProps, Omit<VariantProps<typeof viewVariants>, 'flex'> {
  flex?: boolean | number
  row?: boolean
  column?: boolean
  className?: string
}

export function View({
  flex,
  row,
  column,
  center,
  centerX,
  centerY,
  justify,
  items,
  wrap,
  className,
  children,
  ...props
}: ViewProps) {
  const direction = row ? 'row' : column ? 'column' : 'none'
  const flexValue = typeof flex === 'number' ? true : flex

  const viewClassName = cn(
    viewVariants({
      flex: flexValue,
      direction,
      center,
      centerX,
      centerY,
      justify,
      items,
      wrap,
    }),
    typeof flex === 'number' && `flex-[${flex}]`,
    className
  )

  return (
    <RNView className={viewClassName} {...props}>
      {children}
    </RNView>
  )
}
