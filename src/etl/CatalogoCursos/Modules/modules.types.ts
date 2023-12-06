export type LXPModule = {
  id: number;
  course_fb: string;
  name: string;
  description: string | null;
  index: number;
  accreditation: boolean;
  created_at: string;
  updated_at: string;
  module_fb: string;
  deleted: boolean;
  deleted_at: string | null;
};

export type VdmLMSModule = {
  id?: string;
  course_id: string | null;
  name: string;
  description: string;
  index: number;
  tags: string;
  accreditation: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  legacy_module_fb: string | null;
  legacy_course_fb: string | null;
  legacy: string;
};
