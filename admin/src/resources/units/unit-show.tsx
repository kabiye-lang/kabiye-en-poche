import { Show, SimpleShowLayout, TextField, NumberField, DateField } from 'react-admin'

export const UnitShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="title_en" label="Title (EN)" />
      <TextField source="title_fr" label="Title (FR)" />
      <TextField source="code" />
      <TextField source="description_en" label="Description (EN)" />
      <TextField source="description_fr" label="Description (FR)" />
      <NumberField source="position" />
      <TextField source="status" />
      <DateField source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
)
