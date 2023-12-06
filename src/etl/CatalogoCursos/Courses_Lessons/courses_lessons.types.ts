export type LXPLesson = {
  id: number;
  name: string | null;
  type: string | null;
  description: string | null;
  image_url: string | null;
  lesson_fb: string;
  topic_id: string | null;
  course_fb: string;
  module_id: string;
  weighing: number;
  created_at: string;
  updated_at: string;
  client_id: string;
  hide: boolean;
  is_post: boolean;
  is_deleted: boolean;
  activity_id: string | null;
  claps: number;
  weight: number;
  assign: number | null;
  deleted_at: string | null;
  index: number;
  stage: number | null;
  competencies_json: string | null;
  subtype: string | null;
  privacy: boolean;
  html: string | null;
  video: string | null;
  lectre: string | null;
  created_by: string | null;
  is_individual: boolean;
  embed_json: string | null;
  creating: string | null;
  random: boolean;
  hours: number | null;
  minutes: number | null;
  eval_question_to_evaluate: number | null;
  eval_attempts: number | null;
  users_to_evaluate: number | null;
  rubric: string | null;
  resources_json: string;
  message: string | null;
  tags_json: string | null;
  public: boolean;
  question_banks: string | null;
  user_id: string | null;
  gif_url: string | null;
  group_fb: string | null;
  metadata: boolean;
  image: string | null;
  accreditation: boolean;
  videoalter: string | null;
  restart_time: number | null;
  auto_review_on_enrollment: boolean;
};

export type VdmLMSCourseLesson = {
  id?: string;
  client_id: string;
  course_id: string | null;
  module_id: string | null;
  name: string;
  description: string | null;
  image_url: string;
  message: string | null;
  weighting?: string | null;
  topic_id: string | null;
  is_draft: boolean;
  is_active: boolean;
  is_private: boolean;
  claps: number;
  index: number;
  random: boolean;
  hours: number;
  minutes: number;
  restart_time: number;
  question_to_evaluate: number;
  attempts: number;
  users_to_evaluate: number;
  rubric: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  legacy: string;
  access: LESSON_ACCESS;
  assign: number;
  subtype: LESSON_SUBTYPE | null;
  type: LESSON_TYPE;
  auto_review_on_enrollment: boolean;
  legacy_lesson_fb: string | null;
};

export type LESSON_TYPE =
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

export type LESSON_SUBTYPE = 'URL' | 'HTML' | 'MULTIPLE' | 'PDF' | 'EDITOR';

export type LESSON_ACCESS = 'FREE' | 'PAID';
