import { UCL_LESSON_TYPE } from './user_lessons.types';

export const getUserLessonType = (
  lxpUserLessonType: string | null,
): UCL_LESSON_TYPE | null => {
  switch (lxpUserLessonType) {
    case 'V':
      return 'VIDEO';
      break;
    case 'P':
      return 'PRESENTIAL';
      break;
    case 'H':
      return 'HTML5';
      break;
    case 'T':
      return 'TASK';
      break;
    case 'S':
      return 'SURVEY';
      break;
    case 'E':
      return 'EVALUATION';
      break;
    case 'M':
      return 'MEETING';
      break;
    case 'F':
      return 'FORUM';
      break;
    case 'L':
      return 'LECTURE';
      break;
    case 'A':
      return 'SCORM_HTML';
      break;
    case 'D':
      return 'QUADRANT';
      break;
    case 'EP':
      return 'PRESENTIAL';
      break;

    // TODO: Averiguar este tipo de lección
    // case 'E1':
    //   return '';
    //   break;

    default:
      return null;
      break;
  }
};
