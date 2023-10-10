import { UCL_STATUS_TYPE } from './user_courses.types';

export const getUserCourseStatus = (
  lxpStatus: string,
): UCL_STATUS_TYPE | null => {
  switch (lxpStatus) {
    case 'approved':
      return 'APPROVED';
      break;
    case 'failed':
      return 'FAILED';
      break;
    case 'inProgress':
    case 'in_progress':
      return 'IN_PROGRESS';
      break;
    case 'inactive':
      return 'INACTIVE';
      break;

    default:
      return null;
      break;
  }
};
