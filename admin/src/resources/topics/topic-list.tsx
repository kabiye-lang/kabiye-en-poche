import { CreateButton, Datagrid, ExportButton, List, TextField, TopToolbar } from 'react-admin'

const TopicListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const TopicList = () => (
  <List actions={<TopicListActions />}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" />
    </Datagrid>
  </List>
)
