import { useCallback, useEffect, useState } from 'react'
import type { Extension } from '@codemirror/state'
import type { InputProps } from 'ra-core'
import { useInput } from 'ra-core'

import CodeMirror from '@uiw/react-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'

import { FormError } from '@/components/form-error'

/**
 * CodeMirror-based JSON editor with syntax highlighting, validation, and formatting.
 * Used for lesson_activities.data and similar JSON fields.
 */
export function JsonTextareaInput(props: InputProps & { rows?: number }) {
  const { field, fieldState } = useInput(props)
  const rows = props.rows ?? 12
  const lineHeight = 20
  const minHeight = `${rows * lineHeight}px`

  const [raw, setRaw] = useState(() =>
    typeof field.value === 'object' && field.value !== null
      ? JSON.stringify(field.value, null, 2)
      : ''
  )

  useEffect(() => {
    if (typeof field.value === 'object' && field.value !== null) {
      setRaw(JSON.stringify(field.value, null, 2))
    } else if (field.value == null || field.value === '') {
      setRaw('')
    }
  }, [field.value])

  const handleChange = useCallback(
    (value: string) => {
      setRaw(value)
    },
    [setRaw]
  )

  const handleBlur = useCallback(() => {
    const trimmed = raw.trim()
    if (!trimmed) {
      field.onChange(null)
      field.onBlur()
      return
    }
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      field.onChange(parsed)
    } catch {
      // Keep raw; don't update form - validation/linter will show errors
    }
    field.onBlur()
  }, [raw, field])

  const handleFormat = useCallback(() => {
    const trimmed = raw.trim()
    if (!trimmed) return
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>
      const formatted = JSON.stringify(parsed, null, 2)
      setRaw(formatted)
      field.onChange(parsed)
    } catch {
      // Invalid JSON - do nothing, linter will show the error
    }
  }, [raw, field])

  const extensions: Extension[] = [
    json(),
    lintGutter(),
    linter(jsonParseLinter()),
  ]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {props.label && (
          <label className="text-sm font-medium leading-none">{props.label}</label>
        )}
        <button
          type="button"
          onClick={handleFormat}
          className="rounded border border-input bg-muted px-2 py-1 text-xs font-medium transition-colors hover:bg-muted/80"
        >
          Format
        </button>
      </div>
      <div className="overflow-hidden rounded-md border border-input">
        <CodeMirror
          value={raw}
          onChange={handleChange}
          onBlur={handleBlur}
          height={minHeight}
          extensions={extensions}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            bracketMatching: true,
            closeBrackets: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            tabSize: 2,
            lintKeymap: true,
          }}
          theme="light"
          placeholder="{}"
          editable={!props.disabled}
          indentWithTab
        />
      </div>
      {props.helperText && (
        <p className="text-muted-foreground text-sm">{props.helperText}</p>
      )}
      <FormError fieldState={fieldState} />
    </div>
  )
}
