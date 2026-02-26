import { useEffect, useRef, useState } from 'react'
import { Edit, useNotify, useRedirect, useUpdate, useRecordContext } from 'react-admin'
import { DeleteButton, ShowButton, TopToolbar } from 'react-admin'

import { deleteAudioFromStorage, getAudioPublicUrl, uploadAudioToStorage } from '@/lib/audio-upload'
import { trimSilence } from '@/lib/audio-trim'
import { Input } from '@/components/ui/input'

type ReplaceMode = 'keep' | 'upload' | 'record'

const deleteConfirmTitle = 'Delete this audio?'
const deleteConfirmContent = 'This will permanently remove the audio from storage. This action cannot be undone.'

const AudioEditActions = () => (
  <TopToolbar>
    <ShowButton />
    <DeleteButton
      mutationMode="pessimistic"
      confirmTitle={deleteConfirmTitle}
      confirmContent={deleteConfirmContent}
      confirmColor="warning"
    />
  </TopToolbar>
)

function AudioEditForm() {
  const record = useRecordContext()
  const notify = useNotify()
  const redirect = useRedirect()
  const [update] = useUpdate()
  const [replaceMode, setReplaceMode] = useState<ReplaceMode>('keep')
  const [file, setFile] = useState<File | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recording, setRecording] = useState(false)
  const [trimEnabled, setTrimEnabled] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (record) {
      setName(record.name ?? '')
      setDescription(record.description ?? '')
      setTags(Array.isArray(record.tags) ? record.tags.join(', ') : '')
    }
  }, [record?.id])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (chunksRef.current.length) setRecordedBlob(new Blob(chunksRef.current, { type: recorder.mimeType }))
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

  const clearReplace = () => {
    setRecordedBlob(null)
    setFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!record) return

    const tagsArr = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []
    if (tagsArr.length === 0) {
      notify('At least one tag is required to find audios later', { type: 'warning' })
      return
    }
    const payload: Record<string, unknown> = {
      name: name.trim() || record.name,
      description: description.trim() || null,
      tags: tagsArr,
    }

    let newStoragePath: string | null = null
    let newMimeType: string | undefined

    if (replaceMode === 'upload' && file) {
      const { storagePath, mimeType } = await uploadAudioToStorage(file, name.trim() || file.name)
      newStoragePath = storagePath
      newMimeType = mimeType
      payload.name = name.trim() || file.name
    } else if (replaceMode === 'record' && recordedBlob) {
      let blob: Blob
      let fileName: string
      if (trimEnabled) {
        blob = await trimSilence(recordedBlob)
        fileName = (name.trim() || `audio-${Date.now()}`) + '.wav'
      } else {
        blob = recordedBlob
        fileName = (name.trim() || `audio-${Date.now()}`) + '.webm'
      }
      const { storagePath, mimeType } = await uploadAudioToStorage(blob, fileName)
      newStoragePath = storagePath
      newMimeType = mimeType
      payload.name = name.trim() || fileName.replace(/\.(wav|webm)$/, '')
    }

    if (newStoragePath) {
      payload.storage_path = newStoragePath
      payload.mime_type = newMimeType || 'audio/webm'
      payload.updated_at = new Date().toISOString()
    }

    setSaving(true)
    try {
      await update('audios', { id: record.id, data: payload, previousData: record })
      if (newStoragePath && record.storage_path) {
        try {
          await deleteAudioFromStorage(record.storage_path)
        } catch (err) {
          console.error('Failed to delete old audio from storage:', err)
        }
      }
      notify('ra.notification.updated')
      redirect('list', 'audios')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Update failed', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!record) return null

  const canSave =
    replaceMode === 'keep' || (replaceMode === 'upload' && file) || (replaceMode === 'record' && recordedBlob)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 max-w-md">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Current audio</p>
        <audio controls src={getAudioPublicUrl(record.storage_path)} className="mt-1 w-full" />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Replace audio</p>
        <div className="mb-2 flex gap-4">
          <button
            type="button"
            onClick={() => {
              setReplaceMode('keep')
              clearReplace()
            }}
            className={`text-sm font-medium ${replaceMode === 'keep' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Keep current
          </button>
          <button
            type="button"
            onClick={() => {
              setReplaceMode('upload')
              setRecordedBlob(null)
            }}
            className={`text-sm font-medium ${replaceMode === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Upload new
          </button>
          <button
            type="button"
            onClick={() => {
              setReplaceMode('record')
              setFile(null)
            }}
            className={`text-sm font-medium ${replaceMode === 'record' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            Record new
          </button>
        </div>
        {replaceMode === 'upload' && (
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="border-input block w-full rounded-md border px-3 py-2"
          />
        )}
        {replaceMode === 'record' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={trimEnabled} onChange={(e) => setTrimEnabled(e.target.checked)} />
              <span className="text-sm">Trim silence at start/end</span>
            </label>
            {!recordedBlob ? (
              recording ? (
                <button type="button" onClick={stopRecording} className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
                  Stop
                </button>
              ) : (
                <button type="button" onClick={startRecording} className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90">
                  Start recording
                </button>
              )
            ) : (
              <div className="space-y-2">
                <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                <button type="button" onClick={clearReplace} className="text-muted-foreground text-sm hover:underline">
                  Record again
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Name *</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={record.name} className="mt-1" />
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
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Comma-separated tags (required)" className="mt-1" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !canSave || !tags.trim()} className="rounded bg-primary px-4 py-2 text-white disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={() => redirect('list', 'audios')} className="rounded border px-4 py-2">
          Cancel
        </button>
      </div>
    </form>
  )
}

export const AudioEdit = () => (
  <Edit actions={<AudioEditActions />} mutationMode="pessimistic">
    <AudioEditForm />
  </Edit>
)
