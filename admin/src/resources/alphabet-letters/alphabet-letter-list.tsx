import { CreateButton, Datagrid, ExportButton, List, NumberField, TextField, TopToolbar } from 'react-admin'

const AlphabetLetterListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const AlphabetLetterList = () => (
  <List actions={<AlphabetLetterListActions />} sort={{ field: 'position', order: 'ASC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="id" label="Letter" />
      <TextField source="description_en" label="Description (EN)" />
      <TextField source="description_fr" label="Description (FR)" />
      <NumberField source="position" />
    </Datagrid>
  </List>
)
