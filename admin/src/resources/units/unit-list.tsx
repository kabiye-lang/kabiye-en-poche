import {
  CreateButton,
  Datagrid,
  ExportButton,
  List,
  NumberField,
  SelectInput,
  TextField,
  TopToolbar,
} from 'react-admin'

const UnitListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

const statusChoices = [
  { id: 'available', name: 'Available' },
  { id: 'coming_soon', name: 'Coming Soon' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'disabled', name: 'Disabled' },
]

const unitFilters = [<SelectInput key="status" source="status" choices={statusChoices} label="Status" alwaysOn />]

export const UnitList = () => (
  <List actions={<UnitListActions />} filters={unitFilters} sort={{ field: 'position', order: 'ASC' }}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="title_en" label="Title (EN)" />
      <TextField source="title_fr" label="Title (FR)" />
      <TextField source="code" />
      <NumberField source="position" />
      <TextField source="status" />
    </Datagrid>
  </List>
)
