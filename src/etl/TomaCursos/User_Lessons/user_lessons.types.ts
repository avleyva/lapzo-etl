export type LXPUserLesson = {
  id: string;
  completed: boolean;
  lesson_fb: string | null;
  user_fb: string | null;
  module_id: string | null;
  type: string | null;
  created_at: string;
  updated_at: string;
  course_id: string | null;
  score: number;
  summary: string | null;
  duration: number | null;
  number_of_times: number;
  comments_feedback: string | null;
  evaluated_at: string | null;
  reviewer_feedback: string | null;
  requested: boolean | null;
  requested_at: string | null;
  rubric_feedback: string | null;
  lesson_metadata: string | null;
  downloaded_lesson: boolean;
};

export type VdmLMSUserLesson = {
  id?: string;
  client_id: string;
  course_id: string;
  user_id: string;
  module_id: string;
  lesson_id: string;
  type: UCL_LESSON_TYPE | null;
  progress: number;
  score: number;
  order: number;
  created_at: string;
  updated_at: string;
  legacy: string;
  requested: boolean | null;
  requested_at: string | null;
  rubric_feedback: string | null;
  user_lessons_fb: string | null;
  scorm_metadata: string | null;
  evaluated_at: string | null;
  number_of_times: number | null;
  instructor_feedback: string | null;
  summary: string | null;
  completed_at: string | null;
  legacy_user_fb: string | null;
  legacy_lesson_fb: string | null;
};

export type UCL_LESSON_TYPE =
  | 'UNKNOWN'
  | 'SCORM_HTML'
  | 'QUADRANT'
  | 'EVALUATION'
  | 'EVAL_LABEL'
  | 'PRESENTIAL'
  | 'READ'
  | 'FORUM'
  | 'URL'
  | 'HTML5'
  | 'INTERACTION'
  | 'LECTURE'
  | 'MEETING'
  | 'INSTRUCTION'
  | 'SURVEY'
  | 'TASK'
  | 'TOOLKIT_LEC'
  | 'VIDEO'
  | 'WEBINAR'
  | 'FACE_TO_FACE'
  | 'EMBEDDED'
  | 'INSTRUCTIONS';
