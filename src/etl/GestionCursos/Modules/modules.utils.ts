import { VdmLMSCourse } from '../Courses/courses.types';

export const getCourseId = (
  course_fb: string,
  lmsCourses: VdmLMSCourse[],
): string | null => {
  const course: VdmLMSCourse | undefined = lmsCourses.find(
    (c: any) => c.course_fb === course_fb,
  );

  return course?.id || null;
};
