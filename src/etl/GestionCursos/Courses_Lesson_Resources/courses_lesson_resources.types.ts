export type VdmLMSCoursesLessonsResource = {
  id?: string;
  lesson_id: string;
  content: string;
  index: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  type: RESOURCE_TYPE;
};

export type LXPLessonResource = {
  type: RESOURCE_TYPE;
  content: string;
};

export type RESOURCE_TYPE =
  | 'html'
  | 'lecture'
  | 'video'
  | 'videoalter'
  | 'embed'
  | 'image'
  | 'resources'
  | 'err-invalid'
  | 'err-unknown';
