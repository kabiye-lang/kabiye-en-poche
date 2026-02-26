import { DateField, Show, SimpleShowLayout, TextField } from 'react-admin'

export const TopicShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="name" />
      <DateField source="created_at" showTime />
    </SimpleShowLayout>
  </Show>
)
