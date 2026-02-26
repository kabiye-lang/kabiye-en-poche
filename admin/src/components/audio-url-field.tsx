import { useState } from 'react'

import { AudioPickerModal } from '@/components/audio-picker-modal'
import { Input } from '@/components/ui/input'

interface AudioUrlFieldProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
}

/** Reusable audio URL input with picker button. Use with value/onChange. */
export function AudioUrlField({ value, onChange, label, placeholder }: AudioUrlFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div>
      {label && (
        <label className="text-sm font-medium">{label}</label>
      )}
      <div className="mt-1 flex gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'https://... or use picker'}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="rounded border border-input bg-muted px-3 py-2 text-sm hover:bg-muted/80"
        >
          Pick
        </button>
      </div>
      <AudioPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onChange}
      />
    </div>
  )
}
