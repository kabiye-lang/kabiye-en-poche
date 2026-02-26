import { Edit, ReferenceInput, SelectInput, SimpleForm, TextInput } from 'react-admin'

export const CategoryEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="name" />
      <ReferenceInput source="parent_category" reference="categories">
        <SelectInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Edit>
)
