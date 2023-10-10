export type LXPLessonQuestion = {
  id: string;
  lesson_fb: string;
  type: string;
  image_url: string | null;
  options: string;
  text: string;
  index: number;
  answer: string | null;
  back: boolean;
  mins: number | null;
  secs: string | null;
  question_fb: string | null;
};

export type VdmLMSCourseLessonQuestion = {
  id?: string;
  lesson_id: string;
  type: string;
  text: string;
  index: number;
  answer: string | null;
  image_url: string | null;
  options: string;
  created_at: string;
  updated_at: string;
  mins: number | null;
  back: boolean;
  secs: string | null;
  legacy_lesson_fb?: string | null;
  legacy_question_fb?: string | null;
};
