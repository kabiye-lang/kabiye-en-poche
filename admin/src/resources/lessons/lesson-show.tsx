import { ArrayField, NumberField, ReferenceField, Show, SimpleShowLayout, TextField } from 'react-admin'

export const LessonShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="title_en" label="Title (EN)" />
      <TextField source="title_fr" label="Title (FR)" />
      <ReferenceField source="unit_id" reference="units" link="show" />
      <TextField source="difficulty" />
      <NumberField source="position" />
      <ArrayField source="objectives_en" />
      <ArrayField source="objectives_fr" />
    </SimpleShowLayout>
  </Show>
)
