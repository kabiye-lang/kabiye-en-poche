import type { InputProps } from 'ra-core'

import MDEditor from '@uiw/react-md-editor'
import { useInput } from 'ra-core'
import remarkBreaks from 'remark-breaks'

import '@uiw/react-md-editor/markdown-editor.css'

import { FormError } from '@/components/form-error'

export function MarkdownInput(props: InputProps) {
  const { field, fieldState } = useInput(props)

  return (
    <div className="space-y-2" data-color-mode="light">
      {props.label && <label className="text-sm leading-none font-medium">{props.label}</label>}
      <MDEditor
        value={field.value ?? ''}
        onChange={(value) => field.onChange(value ?? '')}
        height={200}
        preview="live"
        visibleDragbar={false}
        previewOptions={{ remarkPlugins: [remarkBreaks] }}
      />
      {props.helperText && <p className="text-muted-foreground text-sm">{props.helperText}</p>}
      <FormError fieldState={fieldState} />
    </div>
  )
}
