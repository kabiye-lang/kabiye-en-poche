import { CreateButton, Datagrid, ExportButton, List, ReferenceField, TextField, TopToolbar } from 'react-admin'

const CategoryListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const CategoryList = () => (
  <List actions={<CategoryListActions />}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" />
      <ReferenceField source="parent_category" reference="categories" link="show" />
    </Datagrid>
  </List>
)
