import { FunctionField, NumberField, ReferenceField, Show, SimpleShowLayout, TextField } from 'react-admin'

export const LessonContentShow = () => (
  <Show>
    <SimpleShowLayout>
      <ReferenceField source="lesson_id" reference="lessons" link="show" />
      <TextField source="title_en" label="Title (EN)" />
      <TextField source="title_fr" label="Title (FR)" />
      <NumberField source="position" />
      <TextField source="content_en" label="Content (EN)" />
      <TextField source="content_fr" label="Content (FR)" />
      <FunctionField
        source="examples"
        label="Examples"
        render={(record) => (record.examples ? JSON.stringify(record.examples, null, 2) : '(none)')}
      />
    </SimpleShowLayout>
  </Show>
)
