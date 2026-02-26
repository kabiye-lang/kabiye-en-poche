import type { ControllerFieldState } from 'react-hook-form'

import { ValidationError } from 'ra-core'

export const FormError = (props: { fieldState: ControllerFieldState }) => {
  if (
    !props.fieldState.invalid ||
    !props.fieldState.isTouched ||
    !props.fieldState.error?.message
  ) {
    return null
  }

  return (
    <p className="text-destructive text-sm font-medium">
      <ValidationError error={props.fieldState.error?.message} />
    </p>
  )
}
