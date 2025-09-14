import type { VariantProps } from 'tailwind-variants'

import React from 'react'
import { View as RNView, ViewProps as RNViewProps } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
    safeArea: {
      all: '',
      top: '',
      bottom: '',
      left: '',
      right: '',
      horizontal: '',
      vertical: '',
      none: '',
    },
  },
  defaultVariants: {
    flex: false,
    direction: 'none',
    center: false,
    centerX: false,
    centerY: false,
    wrap: false,
    safeArea: 'none',
  },
})

export interface ViewProps extends RNViewProps, Omit<VariantProps<typeof viewVariants>, 'flex'> {
  flex?: boolean | number
  row?: boolean
  column?: boolean
  className?: string
  /**
   * Safe area insets to apply:
   * - 'all': Apply safe area to all edges (top, bottom, left, right)
   * - 'top': Apply safe area only to top (status bar, notch)
   * - 'bottom': Apply safe area only to bottom (home indicator)
   * - 'left': Apply safe area only to left edge
   * - 'right': Apply safe area only to right edge
   * - 'horizontal': Apply safe area to left and right edges
   * - 'vertical': Apply safe area to top and bottom edges
   * - 'none': No safe area (default)
   *
   * @example
   * // Full screen with safe area
   * <View flex safeArea="all" className="bg-white">
   *
   * // Only top safe area for status bar
   * <View safeArea="top" className="bg-blue-500">
   *
   * // Only bottom safe area for home indicator
   * <View safeArea="bottom" className="bg-gray-100">
   */
  safeArea?: 'all' | 'top' | 'bottom' | 'left' | 'right' | 'horizontal' | 'vertical' | 'none'
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
  safeArea,
  className,
  children,
  style,
  ...props
}: ViewProps) {
  const direction = row ? 'row' : column ? 'column' : 'none'
  const flexValue = typeof flex === 'number' ? true : flex
  const insets = useSafeAreaInsets()

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
      safeArea,
    }),
    typeof flex === 'number' && `flex-[${flex}]`,
    className
  )

  // Calculate safe area styles based on the safeArea prop
  const safeAreaStyle = React.useMemo(() => {
    if (!safeArea || safeArea === 'none') return {}

    const style: any = {}

    switch (safeArea) {
      case 'all':
        style.paddingTop = insets.top
        style.paddingBottom = insets.bottom
        style.paddingLeft = insets.left
        style.paddingRight = insets.right
        break
      case 'top':
        style.paddingTop = insets.top
        break
      case 'bottom':
        style.paddingBottom = insets.bottom
        break
      case 'left':
        style.paddingLeft = insets.left
        break
      case 'right':
        style.paddingRight = insets.right
        break
      case 'horizontal':
        style.paddingLeft = insets.left
        style.paddingRight = insets.right
        break
      case 'vertical':
        style.paddingTop = insets.top
        style.paddingBottom = insets.bottom
        break
    }

    return style
  }, [safeArea, insets])

  return (
    <RNView className={viewClassName} style={[safeAreaStyle, style]} {...props}>
      {children}
    </RNView>
  )
}
