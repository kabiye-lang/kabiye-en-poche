import { useRef, useState } from 'react'
import { Create, useNotify, useRedirect } from 'react-admin'

import { trimSilence } from '@/lib/audio-trim'
import { uploadAudio } from '@/lib/audio-upload'
import { Input } from '@/components/ui/input'

type InputMode = 'upload' | 'record'

export const AudioCreate = () => {
  const notify = useNotify()
  const redirect = useRedirect()
  const [mode, setMode] = useState<InputMode>('record')
  const [file, setFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recording, setRecording] = useState(false)
  const [trimEnabled, setTrimEnabled] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const hasAudio = file || recordedBlob

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (chunksRef.current.length) {
          setRecordedBlob(new Blob(chunksRef.current, { type: recorder.mimeType }))
        }
      }
      recorder.start(100)
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch (err) {
      console.error(err)
      notify('Could not access microphone', { type: 'error' })
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let blobToUpload: Blob | null = null
    let fileName = ''
    if (file) {
      blobToUpload = file
      fileName = name.trim() || file.name
    } else if (recordedBlob) {
      if (trimEnabled) {
        blobToUpload = await trimSilence(recordedBlob)
        fileName = (name.trim() || `audio-${Date.now()}`) + '.wav'
      } else {
        blobToUpload = recordedBlob
        fileName = (name.trim() || `audio-${Date.now()}`) + '.webm'
      }
    }
    if (!blobToUpload) {
      notify('Please upload a file or record audio', { type: 'warning' })
      return
    }
    const tagsArr = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    if (tagsArr.length === 0) {
      notify('At least one tag is required to find audios later', { type: 'warning' })
      return
    }
    setUploading(true)
    try {
      await uploadAudio(blobToUpload, {
        name: fileName || `audio-${Date.now()}`,
        description: description.trim() || undefined,
        tags: tagsArr,
      })
      notify('ra.notification.created')
      redirect('list', 'audios')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', { type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const clearRecorded = () => {
    setRecordedBlob(null)
    setFile(null)
  }

  return (
    <Create>
      <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-md">
        <div>
          <div className="mb-2 flex gap-4">
            <button
              type="button"
              onClick={() => { setMode('record'); setFile(null) }}
              className={`text-sm font-medium ${mode === 'record' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Record
            </button>
            <button
              type="button"
              onClick={() => { setMode('upload'); clearRecorded() }}
              className={`text-sm font-medium ${mode === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Upload file
            </button>
          </div>
          {mode === 'upload' && (
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="border-input block w-full rounded-md border px-3 py-2"
            />
          )}
          {mode === 'record' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={trimEnabled}
                  onChange={(e) => setTrimEnabled(e.target.checked)}
                />
                <span className="text-sm">Trim silence at start/end</span>
              </label>
              {!recordedBlob ? (
                recording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
                  >
                    Start recording
                  </button>
                )
              ) : (
                <div className="space-y-2">
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                  <button
                    type="button"
                    onClick={clearRecorded}
                    className="text-muted-foreground text-sm hover:underline"
                  >
                    Record again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium">Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Audio name"
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="border-input mt-1 w-full rounded-md border px-3 py-2"
            rows={2}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tags *</label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Comma-separated tags (required to find audios)"
            className="mt-1"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={uploading || !hasAudio || !tags.trim()}
            className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => redirect('list', 'audios')}
            className="rounded border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </Create>
  )
}
