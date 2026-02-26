import { Show, SimpleShowLayout, TextField, DateField } from 'react-admin'

export const TopicShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" />
      <DateField source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
)
