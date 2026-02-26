import { Show, SimpleShowLayout, TextField, DateField, useRecordContext } from 'react-admin'

import { getAudioPublicUrl } from '@/lib/audio-upload'

const AudioPlayerField = () => {
  const record = useRecordContext()
  const path = record?.storage_path
  if (!path) return null
  const url = getAudioPublicUrl(path)
  return (
    <div className="mt-2">
      <audio controls src={url} className="max-w-full" />
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary mt-1 block text-sm hover:underline">
        {url}
      </a>
    </div>
  )
}

export const AudioShow = () => (
  <Show mutationMode="pessimistic">
    <SimpleShowLayout>
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="tags" />
      <TextField source="storage_path" label="Storage path" />
      <AudioPlayerField />
      <TextField source="mime_type" label="MIME type" />
      <DateField source="created_at" showTime />
      <DateField source="updated_at" showTime />
    </SimpleShowLayout>
  </Show>
)
