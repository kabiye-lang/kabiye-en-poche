import { BooleanField, DateField, NumberField, Show, SimpleShowLayout, TextField } from 'react-admin'

export const CmsPageShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="slug" />
      <TextField source="title_en" label="Title (EN)" />
      <TextField source="title_fr" label="Title (FR)" />
      <TextField source="description_en" label="Description (EN)" />
      <TextField source="description_fr" label="Description (FR)" />
      <TextField source="content_en" label="Content (EN)" />
      <TextField source="content_fr" label="Content (FR)" />
      <NumberField source="sort_order" />
      <BooleanField source="is_active" />
      <DateField source="created_at" showTime />
      <DateField source="updated_at" showTime />
    </SimpleShowLayout>
  </Show>
)
