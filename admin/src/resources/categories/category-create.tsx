import { Create, ReferenceInput, SelectInput, SimpleForm, TextInput } from 'react-admin'

export const CategoryCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" />
      <ReferenceInput source="parent_category" reference="categories">
        <SelectInput optionText="name" />
      </ReferenceInput>
    </SimpleForm>
  </Create>
)
