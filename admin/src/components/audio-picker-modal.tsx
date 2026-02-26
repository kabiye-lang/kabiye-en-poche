import { useCallback, useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { trimSilence } from '@/lib/audio-trim'
import { getAudioPublicUrl, uploadAudio } from '@/lib/audio-upload'
import { supabase } from '@/supabase'

interface AudioRecord {
  id: string
  storage_path: string
  name: string
  description: string | null
  tags: string[]
}

interface AudioPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (_url: string) => void
}

export function AudioPickerModal({ open, onClose, onSelect }: AudioPickerModalProps) {
  const [tab, setTab] = useState<'search' | 'record'>('search')
  const [audios, setAudios] = useState<AudioRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [trimEnabled, setTrimEnabled] = useState(true)
  const [recordName, setRecordName] = useState('')
  const [recordDescription, setRecordDescription] = useState('')
  const [recordTags, setRecordTags] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const fetchAudios = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('audios')
      .select('id, storage_path, name, description, tags')
      .order('created_at', { ascending: false })
      .limit(50)
    if (search.trim()) {
      const term = search.trim()
      query = query.or(`name.ilike.%${term}%,tags.cs.{"${term.replace(/"/g, '')}"}`)
    }
    const { data, error } = await query
    if (error) {
      console.error(error)
      setAudios([])
    } else {
      setAudios(data || [])
    }
    setLoading(false)
  }, [search])

  useEffect(() => {
    if (open && tab === 'search') {
      fetchAudios()
    }
  }, [open, tab, fetchAudios])

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
      alert('Could not access microphone')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }

  const handleUpload = async () => {
    if (!recordedBlob) return
    const tagsArr = recordTags
      ? recordTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []
    if (tagsArr.length === 0) {
      alert('At least one tag is required to find audios later')
      return
    }
    setUploading(true)
    try {
      let blob: Blob
      let fileName: string
      if (trimEnabled) {
        blob = await trimSilence(recordedBlob)
        fileName = (recordName.trim() || `audio-${Date.now()}`) + '.wav'
      } else {
        blob = recordedBlob
        fileName = (recordName.trim() || `audio-${Date.now()}`) + '.webm'
      }
      const result = await uploadAudio(blob, {
        name: fileName,
        description: recordDescription.trim() || undefined,
        tags: tagsArr,
      })
      onSelect(result.url)
      onClose()
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSelect = (storagePath: string) => {
    const url = getAudioPublicUrl(storagePath)
    onSelect(url)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background max-h-[85vh] w-full max-w-lg overflow-hidden rounded-lg shadow-xl">
        <div className="border-border flex border-b px-4 py-2">
          <button
            type="button"
            onClick={() => setTab('search')}
            className={`mr-4 font-medium ${tab === 'search' ? 'text-primary' : 'text-foreground-secondary'}`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setTab('record')}
            className={`font-medium ${tab === 'record' ? 'text-primary' : 'text-foreground-secondary'}`}
          >
            Record
          </button>
          <button type="button" onClick={onClose} className="text-foreground-secondary hover:text-foreground ml-auto">
            ×
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {tab === 'search' && (
            <div className="space-y-4">
              <Input
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAudios()}
              />
              <button type="button" onClick={fetchAudios} className="text-primary text-sm hover:underline">
                Search
              </button>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : audios.length === 0 ? (
                <p className="text-muted-foreground text-sm">No audios found</p>
              ) : (
                <div className="space-y-2">
                  {audios.map((a) => (
                    <div key={a.id} className="border-input flex items-center justify-between rounded border p-2">
                      <div>
                        <p className="font-medium">{a.name}</p>
                        {a.tags?.length ? <p className="text-muted-foreground text-xs">{a.tags.join(', ')}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <audio controls src={getAudioPublicUrl(a.storage_path)} className="h-8 max-w-[120px]" />
                        <button
                          type="button"
                          onClick={() => handleSelect(a.storage_path)}
                          className="text-primary text-sm hover:underline"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'record' && (
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={trimEnabled} onChange={(e) => setTrimEnabled(e.target.checked)} />
                <span className="text-sm">Trim silence at start/end</span>
              </label>
              {!recordedBlob ? (
                <div>
                  {recording ? (
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
                      className="bg-primary hover:bg-primary/90 rounded px-4 py-2 text-white"
                    >
                      Start recording
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={recordName}
                      onChange={(e) => setRecordName(e.target.value)}
                      placeholder="Audio name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={recordDescription}
                      onChange={(e) => setRecordDescription(e.target.value)}
                      placeholder="Optional description"
                      className="border-input mt-1 w-full rounded-md border px-3 py-2"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tags *</label>
                    <Input
                      value={recordTags}
                      onChange={(e) => setRecordTags(e.target.value)}
                      placeholder="Comma-separated tags (required)"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={uploading || !recordTags.trim()}
                      className="bg-primary rounded px-4 py-2 text-white disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload & select'}
                    </button>
                    <button type="button" onClick={() => setRecordedBlob(null)} className="rounded border px-4 py-2">
                      Record again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
