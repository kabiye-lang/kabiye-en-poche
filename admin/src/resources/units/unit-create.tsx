import { Create, SimpleForm, required, TextInput, NumberInput, SelectInput } from 'react-admin'

const unitStatusChoices = [
  { id: 'available', name: 'Available' },
  { id: 'coming_soon', name: 'Coming Soon' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'disabled', name: 'Disabled' },
]

export const UnitCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="title_en" label="Title (EN)" validate={[required()]} />
      <TextInput source="title_fr" label="Title (FR)" validate={[required()]} />
      <TextInput source="code" validate={[required()]} />
      <TextInput source="description_en" label="Description (EN)" multiline />
      <TextInput source="description_fr" label="Description (FR)" multiline />
      <NumberInput source="position" defaultValue={0} />
      <SelectInput source="status" choices={unitStatusChoices} defaultValue="coming_soon" />
    </SimpleForm>
  </Create>
)
