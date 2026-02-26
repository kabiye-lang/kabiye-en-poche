import {
  CreateButton,
  Datagrid,
  Edit,
  EditButton,
  FormTab,
  NumberField,
  NumberInput,
  ReferenceInput,
  ReferenceManyField,
  required,
  SelectInput,
  TabbedForm,
  TextField,
  TextInput,
  useRecordContext,
} from 'react-admin'

const difficultyChoices = [
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
]

const statusChoices = [
  { id: 'available', name: 'Available' },
  { id: 'coming_soon', name: 'Coming Soon' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'disabled', name: 'Disabled' },
]

const CreateRelatedContentButton = () => {
  const lesson = useRecordContext()
  if (!lesson?.id) return null
  return <CreateButton resource="lesson_contents" state={{ record: { lesson_id: lesson.id } }} />
}

const CreateRelatedActivityButton = () => {
  const lesson = useRecordContext()
  if (!lesson?.id) return null
  return <CreateButton resource="lesson_activities" state={{ record: { lesson_id: lesson.id } }} />
}

export const LessonEdit = () => (
  <Edit mutationMode="pessimistic">
    <TabbedForm>
      <FormTab label="Lesson info">
        <TextInput source="title_en" label="Title (EN)" validate={[required()]} />
        <TextInput source="title_fr" label="Title (FR)" validate={[required()]} />
        <ReferenceInput source="unit_id" reference="units" sort={{ field: 'position', order: 'ASC' }}>
          <SelectInput optionText="title_en" validate={[required()]} />
        </ReferenceInput>
        <SelectInput source="difficulty" choices={difficultyChoices} />
        <SelectInput source="status" choices={statusChoices} />
        <NumberInput source="position" />
      </FormTab>

      <FormTab label="Contents">
        <ReferenceManyField reference="lesson_contents" target="lesson_id" label={false}>
          <Datagrid rowClick="edit" bulkActionButtons={false}>
            <TextField source="title_en" label="Title (EN)" />
            <NumberField source="position" />
            <EditButton />
          </Datagrid>
        </ReferenceManyField>
        <CreateRelatedContentButton />
      </FormTab>

      <FormTab label="Activities">
        <ReferenceManyField reference="lesson_activities" target="lesson_id" label={false}>
          <Datagrid rowClick="edit" bulkActionButtons={false}>
            <TextField source="activity_type" label="Type" />
            <TextField source="question_en" label="Question (EN)" />
            <NumberField source="position" />
            <EditButton />
          </Datagrid>
        </ReferenceManyField>
        <CreateRelatedActivityButton />
      </FormTab>
    </TabbedForm>
  </Edit>
)
