import type { AudioKind, AudioReviewFields, AudioSource, AudioStatus } from '@/lib/audio-review'

import { Input } from '@/components/ui/input'
import { kbpKey } from '@/lib/kbp-key'

const selectClass = 'border-input mt-1 block w-full rounded-md border bg-transparent px-3 py-2 text-sm'

interface AudioReviewFieldsInputProps {
  value: AudioReviewFields
  onChange: (value: AudioReviewFields) => void
}

/** Kind, Kabiyè text, lexeme id, source and review status of an audio. */
export function AudioReviewFieldsInput({ value, onChange }: AudioReviewFieldsInputProps) {
  const set = <K extends keyof AudioReviewFields>(field: K, fieldValue: AudioReviewFields[K]) =>
    onChange({ ...value, [field]: fieldValue })
  const key = kbpKey(value.kbp_text ?? '')

  return (
    <fieldset className="space-y-4 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">Review</legend>
      <div>
        <label className="text-sm font-medium">Kind</label>
        <select
          value={value.kind ?? ''}
          onChange={(e) => set('kind', (e.target.value || null) as AudioKind | null)}
          className={selectClass}
        >
          <option value="">Not set</option>
          <option value="word">Word</option>
          <option value="sentence">Sentence</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Kabiyè text</label>
        <Input
          value={value.kbp_text ?? ''}
          onChange={(e) => set('kbp_text', e.target.value)}
          placeholder="What the recording says, as written in lessons"
          className="mt-1"
        />
        <p className="text-muted-foreground mt-1 text-xs">Match key: {key || '—'}</p>
      </div>
      <div>
        <label className="text-sm font-medium">Lexeme id{value.kind === 'word' ? ' *' : ''}</label>
        <Input
          value={value.lexeme_id ?? ''}
          onChange={(e) => set('lexeme_id', e.target.value)}
          placeholder="e.g. keɖe#1"
          className="mt-1"
        />
        {value.kind === 'word' && (
          <p className="text-muted-foreground mt-1 text-xs">
            Required to approve a word: without it the audio could play for a same-spelling word with another tone.
          </p>
        )}
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Source</label>
          <select
            value={value.source}
            onChange={(e) => set('source', e.target.value as AudioSource)}
            className={selectClass}
          >
            <option value="native">Native speaker</option>
            <option value="tts">TTS (synthetic)</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium">Status</label>
          <select
            value={value.status}
            onChange={(e) => set('status', e.target.value as AudioStatus)}
            className={selectClass}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
    </fieldset>
  )
}
