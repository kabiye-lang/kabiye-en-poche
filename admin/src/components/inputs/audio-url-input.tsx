import type { InputProps } from 'ra-core'

import { useState } from 'react'

import { useInput } from 'ra-core'

import { AudioPickerModal } from '@/components/audio-picker-modal'
import { FormError } from '@/components/form-error'
import { Input } from '@/components/ui/input'

/**
 * Input for audio URLs with optional picker (search/record from Supabase Storage).
 */
export function AudioUrlInput(props: InputProps) {
  const { field, fieldState } = useInput(props)
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      {props.label && <label className="text-sm leading-none font-medium">{props.label}</label>}
      <div className="flex gap-2">
        <Input {...field} type="url" placeholder="https://... or use picker" className="flex-1" />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="border-input bg-muted hover:bg-muted/80 rounded border px-3 py-2 text-sm"
        >
          Pick audio
        </button>
      </div>
      <AudioPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => field.onChange(url)}
      />
      {props.helperText && <p className="text-muted-foreground text-sm">{props.helperText}</p>}
      <FormError fieldState={fieldState} />
    </div>
  )
}
