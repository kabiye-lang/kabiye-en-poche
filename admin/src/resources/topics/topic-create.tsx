import { Create, SimpleForm, TextInput } from 'react-admin'

export const TopicCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" />
    </SimpleForm>
  </Create>
)
