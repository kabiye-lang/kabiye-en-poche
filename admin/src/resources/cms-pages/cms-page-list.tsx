import {
  BooleanField,
  CreateButton,
  Datagrid,
  ExportButton,
  List,
  NumberField,
  TextField,
  TopToolbar,
} from 'react-admin'

const CmsPageListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const CmsPageList = () => (
  <List actions={<CmsPageListActions />} sort={{ field: 'sort_order', order: 'ASC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="slug" />
      <TextField source="title_en" label="Title (EN)" />
      <TextField source="title_fr" label="Title (FR)" />
      <NumberField source="sort_order" />
      <BooleanField source="is_active" />
    </Datagrid>
  </List>
)
