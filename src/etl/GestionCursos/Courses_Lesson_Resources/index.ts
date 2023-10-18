import serverGlobals from '../../../config/global_conf';
import { VdmLMSCoursesLessonsResource } from './courses_lesson_resources.types';
import { sleep } from '../../../utils/utils';
import { VdmLMSCourse } from '../Courses/courses.types';
import { VdmLMSModule } from '../Modules/modules.types';
import { LXPLesson } from '../Lessons/lessons.types';
import { VdmLMSCourseLesson } from '../Courses_Lessons/courses_lessons.types';
import { getLXPLessonResource } from './courses_lesson_resource.utils';

let vdmLMSCoursesLessonsResources: VdmLMSCoursesLessonsResource[];

let lxpLessons: LXPLesson[];
let vdmLMSCoursesLessons: VdmLMSCourseLesson[];

let vdmCoursesLessons: any[];

const newCourseLessonResourcesForLMS: VdmLMSCoursesLessonsResource[] = [];

let lmsClient: any;

/**
 * Método de extracción de lecciones de LXP
 */
const mainExtractFn = async () => {
  try {
    const knexLxp = serverGlobals.knexLxp;
    const knexVdmLms = serverGlobals.knexVdmLms;

    // Se obtienen las lecciones asociadas a los cursos del LMS de VDM
    vdmCoursesLessons = await knexVdmLms('courses_lessons')
      .select('legacy_lesson_fb', 'id')
      .where('client_id', lmsClient.id);

    // Obtención de las lecciones en LXP que tienen una asociación en VDM
    lxpLessons = await knexLxp('lessons_cl')
      .select('lessons_cl.*')
      .whereIn(
        'lessons_cl.lesson_fb',
        vdmCoursesLessons.map((c: any) => c.legacy_lesson_fb),
      );

    console.log(
      'Total de lecciones en LXP asociadas a los cursos del LMS:',
      lxpLessons.length,
    );
  } catch (error: any) {
    console.log('** Error en la extracción', error.message);
    throw new Error(error.message);
  }
};

/**
 * Método para transformar los lecciones de LXP al LMS
 */
const mainTransformFn = async () => {
  const knexVdm = serverGlobals.knexVdm;
  const knexVdmLms = serverGlobals.knexVdmLms;
  const clientSubdomain = serverGlobals.transformClient;

  try {
    // Se obtienen todas las lecciones de LXP que aún no han sido agregadas al LMS de VDM
    for (const lxpLesson of lxpLessons) {
      const lmsCourseLessonTmp = vdmCoursesLessons.find(
        (e: any) => e.legacy_lesson_fb == lxpLesson.lesson_fb,
      );

      const lxpResourceObject = getLXPLessonResource(lxpLesson);
      if (lxpResourceObject) {
        const newLMSCourseLessonResourceTmp: VdmLMSCoursesLessonsResource = {
          lesson_id: vdmCoursesLessons.find(
            (c: any) => c.legacy_lesson_fb === lxpLesson.lesson_fb,
          ).id,
          content: JSON.stringify(lxpResourceObject?.content || {}),
          index: 0, // TODO: Revisar si este campo seguirá siendo necesario. Es posible que se elimine.
          enabled: false, // TODO: Revisar si este campo seguirá siendo necesario. Es posible que se elimine.
          created_at: lxpLesson.created_at,
          updated_at: lxpLesson.updated_at,
          type: lxpResourceObject?.type || 'err-unknown',
        };

        newCourseLessonResourcesForLMS.push(newLMSCourseLessonResourceTmp);
      }
    }
    console.log(
      'Total de recursos de lecciones transformadas para carga hacia el LMS:',
      newCourseLessonResourcesForLMS.length,
    );
  } catch (error: any) {
    console.error('** Error en la transformación', error.message);
  }
};

/**
 * Método para realizar la carga de recursos de lecciones ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
  const knexVdmLms = serverGlobals.knexVdmLms;
  try {
    console.log('Cargando recursos de lecciones en el LMS...');
    if (!newCourseLessonResourcesForLMS.length) {
      console.log('No hay recursos de lecciones nuevas para cargar en el LMS');
      return;
    }
    await knexVdmLms('courses_lessons_resources').insert(
      newCourseLessonResourcesForLMS,
    );
    // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
    await sleep(2000);
  } catch (error: any) {
    console.log('** Error en la carga de Course Lessons al LMS', error.message);
  }
};

/**
 * Método principal que coordina el pipeline de importación de recursos de lecciones
 */
export const startCourseLessonsResourcesPipeline = async () => {
  console.log('\n**************************************');
  console.log('Iniciando pipeline de course_lessons_resources\n');

  try {
    // Se obtiene el ID del cliente en el LMS de VDM
    const knexVdmLms = serverGlobals.knexVdmLms;
    const clientSubdomain = serverGlobals.transformClient;

    lmsClient = await knexVdmLms('clients')
      .select('id')
      .where('subdomain', clientSubdomain)
      .first();

    // Inicio de extract
    await mainExtractFn();

    // Inicio de transform
    await mainTransformFn();

    // Inicio de load
    await mainLoadFn();

    console.log('\nPipeline de course_lessons_resources finalizado');
    console.log('**************************************');
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
