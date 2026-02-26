import {
  CreateButton,
  Datagrid,
  ExportButton,
  List,
  NumberField,
  ReferenceField,
  ReferenceInput,
  SelectInput,
  TextField,
  TopToolbar,
} from 'react-admin'

const LessonListActions = () => (
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

const lessonFilters = [
  <ReferenceInput
    key="unit_id"
    source="unit_id"
    reference="units"
    label="Unit"
    sort={{ field: 'position', order: 'ASC' }}
    alwaysOn
  >
    <SelectInput optionText="title_en" />
  </ReferenceInput>,
  <SelectInput key="status" source="status" choices={statusChoices} label="Status" alwaysOn />,
]

export const LessonList = () => (
  <List
    actions={<LessonListActions />}
    filters={lessonFilters}
    sort={{ field: 'position', order: 'ASC' }}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="title_en" label="Title (EN)" />
      <TextField source="title_fr" label="Title (FR)" />
      <ReferenceField source="unit_id" reference="units" link="show">
        <TextField source="title_en" />
      </ReferenceField>
      <TextField source="difficulty" />
      <TextField source="status" />
      <NumberField source="position" />
    </Datagrid>
  </List>
)
