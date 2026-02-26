import { Edit, SimpleForm, TextInput } from 'react-admin'

export const TopicEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Edit>
)
