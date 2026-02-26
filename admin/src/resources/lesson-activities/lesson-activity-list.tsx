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

const LessonActivityListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

const lessonActivityFilters = [
  <ReferenceInput key="lesson_id" source="lesson_id" reference="lessons">
    <SelectInput optionText="title_en" label="Lesson" />
  </ReferenceInput>,
]

export const LessonActivityList = () => (
  <List
    actions={<LessonActivityListActions />}
    filters={lessonActivityFilters}
    sort={{ field: 'position', order: 'ASC' }}
  >
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="lesson_id" reference="lessons" link="show" />
      <TextField source="activity_type" label="Type" />
      <TextField source="question_en" label="Question (EN)" />
      <NumberField source="position" />
    </Datagrid>
  </List>
)
