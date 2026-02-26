import { Show, SimpleShowLayout, TextField, NumberField, DateField } from 'react-admin'

export const AlphabetLetterShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" label="Letter" />
      <TextField source="description_en" label="Description (EN)" />
      <TextField source="description_fr" label="Description (FR)" />
      <TextField source="pronunciation_en" label="Pronunciation (EN)" />
      <TextField source="pronunciation_fr" label="Pronunciation (FR)" />
      <TextField source="type" />
      <TextField source="audio_url" label="Audio URL" />
      <TextField source="image_url" label="Image URL" />
      <NumberField source="position" />
      <DateField source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
)
