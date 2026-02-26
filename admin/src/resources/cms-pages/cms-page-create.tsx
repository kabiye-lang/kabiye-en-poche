import { Create, SimpleForm, required, TextInput, NumberInput, BooleanInput } from 'react-admin'

import { MarkdownInput } from '@/components/inputs/markdown-input'

export const CmsPageCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="slug" validate={[required()]} />
      <TextInput source="title_en" label="Title (EN)" validate={[required()]} />
      <TextInput source="title_fr" label="Title (FR)" validate={[required()]} />
      <TextInput source="description_en" label="Description (EN)" multiline />
      <TextInput source="description_fr" label="Description (FR)" multiline />
      <MarkdownInput source="content_en" label="Content (EN)" />
      <MarkdownInput source="content_fr" label="Content (FR)" />
      <NumberInput source="sort_order" defaultValue={0} />
      <BooleanInput source="is_active" defaultValue />
    </SimpleForm>
  </Create>
)
