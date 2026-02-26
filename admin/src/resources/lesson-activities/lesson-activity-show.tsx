import { FunctionField, NumberField, ReferenceField, Show, SimpleShowLayout, TextField } from 'react-admin'

export const LessonActivityShow = () => (
  <Show>
    <SimpleShowLayout>
      <ReferenceField source="lesson_id" reference="lessons" link="show" />
      <TextField source="activity_type" label="Type" />
      <NumberField source="position" />
      <TextField source="instructions_en" label="Instructions (EN)" />
      <TextField source="instructions_fr" label="Instructions (FR)" />
      <TextField source="question_en" label="Question (EN)" />
      <TextField source="question_fr" label="Question (FR)" />
      <FunctionField
        source="data"
        label="Data"
        render={(record) => (record.data ? JSON.stringify(record.data, null, 2) : '(none)')}
      />
    </SimpleShowLayout>
  </Show>
)
