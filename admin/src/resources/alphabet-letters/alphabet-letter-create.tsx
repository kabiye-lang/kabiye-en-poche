import { Create, SimpleForm, required, TextInput, NumberInput } from 'react-admin'

import { MarkdownInput } from '@/components/inputs/markdown-input'

export const AlphabetLetterCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="id" label="Letter ID" validate={[required()]} helperText="Single character (e.g. ɛ, ɔ)" />
      <MarkdownInput source="description_en" label="Description (EN)" validate={[required()]} />
      <MarkdownInput source="description_fr" label="Description (FR)" validate={[required()]} />
      <MarkdownInput source="pronunciation_en" label="Pronunciation (EN)" />
      <MarkdownInput source="pronunciation_fr" label="Pronunciation (FR)" />
      <TextInput source="type" />
      <TextInput source="audio_url" label="Audio URL" />
      <TextInput source="image_url" label="Image URL" />
      <NumberInput source="position" defaultValue={0} />
    </SimpleForm>
  </Create>
)
