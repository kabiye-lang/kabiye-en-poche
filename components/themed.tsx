/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import type {
  ButtonProps as RNUIButtonProps,
  TextProps as RNUITextProps,
  ViewProps as RNUIViewProps,
} from 'react-native-ui-lib'

import React, { forwardRef } from 'react'
import { Button as RNButton, Text as RNText, View as RNView } from 'react-native'
import { Button as RNUIButton, Text as RNUIText, View as RNUIView } from 'react-native-ui-lib'

import { CustomTypographyProps } from '@/utils/design-system'

export type TextProps = RNText['props']
export type ViewProps = RNView['props']
export type ButtonProps = RNButton['props']

export function Text(props: TextProps & RNUITextProps & CustomTypographyProps) {
  let additionalProps: CustomTypographyProps = {}
  if (!props.family && (props.h1 || props.h2 || props.h3)) {
    additionalProps = { family: 'fig4' }
  }

  return <RNUIText {...props} {...additionalProps} />
}

export const View = forwardRef((props: ViewProps & RNUIViewProps, _ref) => {
  return <RNUIView {...props} />
})

// using forwardRef to fix Warning: Function components cannot be given refs. Attempts to access this ref will fail
// This happens when used as a child of Link
export const Button = forwardRef(
  (props: ButtonProps & Omit<RNUIButtonProps, 'title'> & CustomTypographyProps, _ref) => {
    return <RNUIButton {...props} />
  }
)
