import { Show, SimpleShowLayout, ReferenceField, TextField, DateField } from 'react-admin'

export const CategoryShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" />
      <ReferenceField source="parent_category" reference="categories" link="show" />
      <DateField source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
)
