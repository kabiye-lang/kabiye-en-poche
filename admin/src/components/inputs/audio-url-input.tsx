import { useState } from 'react'
import type { InputProps } from 'ra-core'
import { useInput } from 'ra-core'

import { FormError } from '@/components/form-error'
import { Input } from '@/components/ui/input'
import { AudioPickerModal } from '@/components/audio-picker-modal'

/**
 * Input for audio URLs with optional picker (search/record from Supabase Storage).
 */
export function AudioUrlInput(props: InputProps) {
  const { field, fieldState } = useInput(props)
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      {props.label && (
        <label className="text-sm font-medium leading-none">{props.label}</label>
      )}
      <div className="flex gap-2">
        <Input
          {...field}
          type="url"
          placeholder="https://... or use picker"
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded border border-input bg-muted px-3 py-2 text-sm hover:bg-muted/80"
        >
          Pick audio
        </button>
      </div>
      <AudioPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => field.onChange(url)}
      />
      {props.helperText && (
        <p className="text-muted-foreground text-sm">{props.helperText}</p>
      )}
      <FormError fieldState={fieldState} />
    </div>
  )
}
