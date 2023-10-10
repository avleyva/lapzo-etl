export type LXPUserCourse = {
  id: string;
  created_at: string;
  updated_at: string;
  last_lesson: string | null;
  last_lesson_id: string | null;
  module_id: string | null;
  progress: number;
  score: number;
  user_fb: string;
  course_fb: string;
  deserted_at: string | null;
  last_update: string | null;
  group_id: string | null;
  completed_at: string | null;
  status: string;
  last_module_visit: number;
  course_id: number | null;
  user_id: number | null;
  deleted: boolean;
  group_history: string | null;
  accreditation_date: string | null;
  accredited: boolean;
  deleted_by: string | null;
  can_unsubscribe: boolean;
  manual_score: number;
};

export type VdmLMSUserCourse = {
  id?: string;
  client_id: string | null;
  course_id: string | null;
  user_id: string | null;
  status: UCL_STATUS_TYPE | null;
  progress: number;
  completed_at: string | null;
  score: number;
  scoring: string;
  activity: string;
  last_update: string | null;
  approved: boolean;
  approval: UCL_APPROVED_TYPE;
  created_at: string;
  updated_at: string;
  deleted_by: string | null;
  deleted_at: string | null;
  accreditation: string | null;
  abandoning: string | null;
  legacy: string | null;
  group_fb: string | null;
  legacy_user_fb: string | null;
  legacy_course_fb: string | null;
};

export type UCL_STATUS_TYPE =
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'FAILED'
  | 'INACTIVE'
  | 'STARTED'
  | 'COMPLETED'
  | 'QUIT'
  | 'INVALID'
  | 'EMPTY'
  | 'NULL';

export type UCL_APPROVED_TYPE =
  | 'NA'
  | 'PENDING'
  | 'EVALUATED'
  | 'INVALID'
  | 'NULL';
