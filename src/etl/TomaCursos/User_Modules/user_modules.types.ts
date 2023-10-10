export type LXPUserModule = {
  id: number;
  user_fb: string | null;
  module_fb: string;
  course_fb: string | null;
  last_lesson_fb: string | null;
  last_lesson_image_url: string | null;
  last_lesson_type: string | null;
  last_update: string | null;
  progress: number | null;
  score: number | null;
};

export type VdmLMSUserModule = {
  id?: string;
  user_id: string;
  module_id: string;
  progress: number | null;
  score: number | null;
  last_updated: string | null;
  last_lesson_id: string | null;
  last_activity: string | null;
  legacy: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  course_id: string;
  legacy_module_fb: string | null;
};
