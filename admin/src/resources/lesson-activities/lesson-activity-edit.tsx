import {
  Button,
  Edit,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  SaveButton,
  Toolbar,
  TopToolbar,
  NumberInput,
  TextInput,
  required,
  useRecordContext,
  useRedirect,
} from 'react-admin'

import {
  ActivityDataFormInput,
  validateActivityData,
} from '@/components/inputs/activity-data-form'

const LessonActivityEditActions = () => {
  const record = useRecordContext()
  const redirect = useRedirect()
  return (
    <TopToolbar>
      <Button
        label="Cancel"
        onClick={() =>
          redirect(
            record?.lesson_id ? `/lessons/${record.lesson_id}/2` : '/lesson_activities'
          )
        }
      />
    </TopToolbar>
  )
}

const LessonActivityEditToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
)

const activityTypeChoices = [
  { id: 'audio', name: 'Audio (single or conversation)' },
  { id: 'listen_choose', name: 'Listen & Choose' },
  { id: 'listen_type', name: 'Listen & Type' },
  { id: 'match_pairs', name: 'Match Pairs' },
  { id: 'order_words', name: 'Order Words' },
  { id: 'fill_blank', name: 'Fill Blank' },
  { id: 'multiple_choice', name: 'Multiple Choice' },
  { id: 'true_false', name: 'True/False' },
]

const DATA_HELPER =
  'Fill the fields below according to the activity type. Data is stored as JSON.'

export const LessonActivityEdit = () => (
  <Edit
    mutationMode="pessimistic"
    actions={<LessonActivityEditActions />}
    redirect={(_, __, data) =>
      data?.lesson_id ? `/lessons/${data.lesson_id}/2` : 'list'
    }
  >
    <SimpleForm toolbar={<LessonActivityEditToolbar />}>
      <ReferenceInput source="lesson_id" reference="lessons">
        <SelectInput optionText="title_en" validate={[required()]} />
      </ReferenceInput>
      <SelectInput
        source="activity_type"
        choices={activityTypeChoices}
        validate={[required()]}
      />
      <NumberInput source="position" />

      <TextInput source="instructions_en" label="Instructions (EN)" multiline />
      <TextInput source="instructions_fr" label="Instructions (FR)" multiline />
      <TextInput source="question_en" label="Question (EN)" multiline />
      <TextInput source="question_fr" label="Question (FR)" multiline />

      <ActivityDataFormInput
        source="data"
        label="Activity Data"
        helperText={DATA_HELPER}
        validate={validateActivityData}
      />
    </SimpleForm>
  </Edit>
)
