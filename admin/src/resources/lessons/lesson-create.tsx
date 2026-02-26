import { Create, NumberInput, ReferenceInput, required, SelectInput, SimpleForm, TextInput } from 'react-admin'

const difficultyChoices = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
]

const statusChoices = [
  { id: 'available', name: 'Available' },
  { id: 'coming_soon', name: 'Coming Soon' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'disabled', name: 'Disabled' },
]

export const LessonCreate = () => (
  <Create redirect="edit">
    <SimpleForm>
      <TextInput source="title_en" label="Title (EN)" validate={[required()]} />
      <TextInput source="title_fr" label="Title (FR)" validate={[required()]} />
      <ReferenceInput source="unit_id" reference="units" sort={{ field: 'position', order: 'ASC' }}>
        <SelectInput optionText="title_en" validate={[required()]} />
      </ReferenceInput>
      <SelectInput source="difficulty" choices={difficultyChoices} defaultValue="beginner" />
      <SelectInput source="status" choices={statusChoices} defaultValue="available" />
      <NumberInput source="position" defaultValue={0} />
    </SimpleForm>
  </Create>
)
