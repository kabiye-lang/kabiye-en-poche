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

const LessonContentListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

const lessonContentFilters = [
  <ReferenceInput key="lesson_id" source="lesson_id" reference="lessons">
    <SelectInput optionText="title_en" label="Lesson" />
  </ReferenceInput>,
]

export const LessonContentList = () => (
  <List
    actions={<LessonContentListActions />}
    filters={lessonContentFilters}
    sort={{ field: 'position', order: 'ASC' }}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="lesson_id" reference="lessons" link="show" />
      <TextField source="title_en" label="Title (EN)" />
      <NumberField source="position" />
    </Datagrid>
  </List>
)
