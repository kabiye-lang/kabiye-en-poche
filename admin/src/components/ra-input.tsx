import type { InputProps } from 'ra-core'
import { useInput, useTranslate } from 'ra-core'

import { cn } from '@/lib/utils'

import { FormError } from './form-error'
import { Input } from './ui/input'

export const RaInput = (props: InputProps & { className?: string }) => {
  const translate = useTranslate()
  const { field, fieldState } = useInput(props)

  return (
    <div className={cn('grid gap-2', props.className)}>
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {typeof props.label === 'string' ? translate(props.label, { _: props.label }) : props.label}
      </label>
      <Input {...field} type={props.type} />
      {props.helperText && (
        <p className="text-muted-foreground text-sm">{props.helperText}</p>
      )}
      <FormError fieldState={fieldState} />
    </div>
  )
}
