import serverGlobals from '../../../config/global_conf';
import { LXPUserLesson, VdmLMSUserLesson } from './user_lessons.types';
import { sleep } from '../../../utils/utils';
import { getUserLessonType } from './user_lessons.utils';

let lxpUserLessons: LXPUserLesson[];
let vdmLMSUserLessons: VdmLMSUserLesson[];

let lmsCourses: any[]; // Cursos del LMS de VDM
let lmsModules: any[]; // Módulos del LMS de VDM
let lmsLessons: any[]; // Lecciones del LMS de VDM
let lmsUsers: any[]; // Usuarios del LMS de VDM

let vdmCoursesLessons: any[];

const newLMSUserLessonsForLMS: VdmLMSUserLesson[] = [];

let lmsClient: any;

/**
 * Método de extracción de user_lessons de LXP
 */
const mainExtractFn = async () => {
  try {
    const knexLxp = serverGlobals.knexLxp;
    const knexVdmLms = serverGlobals.knexVdmLms;
    const clientSubdomain = serverGlobals.transformClient;

    /*********************************************************************
     * Información requerida de antelación para la extracción (Pre-Requisitos)
     */
    // Se obtiene el ID del cliente en el LMS de VDM
    lmsClient = await knexVdmLms('clients')
      .select('id')
      .where('subdomain', clientSubdomain)
      .first();

    // Se obtienen los cursos asociados al cliente del LMS de VDM
    lmsCourses = await knexVdmLms('courses')
      .select('legacy_course_fb', 'id')
      .where('client_id', lmsClient.id);

    // Se obtienen los módulos asociados al cliente del LMS de VDM
    lmsModules = await knexVdmLms('courses_modules')
      .select('courses_modules.legacy_module_fb', 'courses_modules.id')
      .join('courses', 'courses.id', 'courses_modules.course_id')
      .where('client_id', lmsClient.id);

    lmsLessons = await knexVdmLms('courses_lessons')
      .select('legacy_lesson_fb', 'id')
      .where('client_id', lmsClient.id);

    // Se obtienen los usuarios asociados al cliente del LMS de VDM
    lmsUsers = await knexVdmLms('users')
      .select('id', 'email', 'legacy_user_fb')
      .where('client_id', lmsClient.id);

    /*********************************************************************
     * Extracción de información existenten en el destino (LMS de VDM)
     */
    // Se obtienen los user_lessons existentes en el LMS de VDM
    vdmLMSUserLessons = await knexVdmLms('user_lessons')
      .select('user_lessons.*')
      .join('courses', 'courses.id', 'user_lessons.course_id')
      .where('courses.client_id', lmsClient.id);

    console.log(
      'Total de registros en contrados en user_lessons en el LMS:',
      vdmLMSUserLessons.length,
    );

    /*********************************************************************
     * Extracción de información existente en el origen (LXP)
     */
    // Obtención de los user_lessons existentes en LXP
    lxpUserLessons = await knexLxp('users_lessons_cl')
      .select('users_lessons_cl.*')
      .whereIn(
        'users_lessons_cl.course_id',
        lmsCourses.map((c: any) => c.legacy_course_fb),
      );

    console.log(
      'Total de registros encontrados en user_lessons_cl en LXP:',
      lxpUserLessons.length,
    );
  } catch (error: any) {
    console.log('** Error en la extracción', error.message);
    throw new Error(error.message);
  }
};

/**
 * Método para transformar los user_lessons de LXP al LMS
 */
const mainTransformFn = async () => {
  const knexVdm = serverGlobals.knexVdm;
  const knexVdmLms = serverGlobals.knexVdmLms;
  const clientSubdomain = serverGlobals.transformClient;

  try {
    for (const lxpUserLesson of lxpUserLessons) {
      const lmsUserLessonTmp = vdmLMSUserLessons.find(
        (e: any) => e.user_lessons_fb === lxpUserLesson.lesson_fb,
      );

      if (!lmsUserLessonTmp) {
        const lmsUserIdTmp =
          lmsUsers.find((u: any) => u.legacy_user_fb === lxpUserLesson.user_fb)
            ?.id || null;

        if (!lmsUserIdTmp) {
          continue;
        }

        const legacyInfo = {
          user_fb: lxpUserLesson.user_fb || null,
          client_fb: clientSubdomain,
          course_fb: lxpUserLesson.course_id || null,
          lesson_fb: lxpUserLesson.lesson_fb || null,
          module_fb: lxpUserLesson.module_id || null,
          type: lxpUserLesson.type || null,
          lxp_id: lxpUserLesson.id,
          comments_feedback: lxpUserLesson.comments_feedback || null,
        };

        const newLMSUserLessonsTmp: VdmLMSUserLesson = {
          client_id: lmsClient.id,
          course_id:
            lmsCourses.find(
              (c: any) => c.legacy_course_fb === lxpUserLesson.course_id,
            )?.id || null,
          user_id: lmsUserIdTmp,
          module_id:
            lmsModules.find(
              (m: any) =>
                m.legacy_module_fb === lxpUserLesson.module_id &&
                m.legacy_course_fb === lxpUserLesson.course_id,
            )?.id || null,
          lesson_id:
            lmsLessons.find(
              (e: any) => e.legacy_lesson_fb === lxpUserLesson.lesson_fb,
            )?.id || null,
          type: getUserLessonType(lxpUserLesson.type),
          progress: lxpUserLesson.completed ? 100 : 0,
          score: Number.parseInt(lxpUserLesson?.score?.toString() || '0'),
          order: 0, // TODO: Este campo no viene en user_lessons_cl
          created_at: lxpUserLesson.created_at,
          updated_at: lxpUserLesson.updated_at,
          legacy: JSON.stringify(legacyInfo),
          requested: lxpUserLesson.requested || null,
          requested_at: lxpUserLesson.requested_at || null,
          rubric_feedback: JSON.stringify(lxpUserLesson.rubric_feedback),
          user_lessons_fb: lxpUserLesson.lesson_fb || null,
          scorm_metadata: JSON.stringify(lxpUserLesson.lesson_metadata),
          evaluated_at: lxpUserLesson.evaluated_at || null,
          number_of_times: lxpUserLesson.number_of_times || null,
          instructor_feedback:
            lmsUsers.find(
              (u: any) => u.legacy_user_fb === lxpUserLesson.reviewer_feedback,
            )?.id || null,
          summary: JSON.stringify(lxpUserLesson.summary),
          completed_at:
            lxpUserLesson.completed === true ? lxpUserLesson.updated_at : null,
          legacy_user_fb: lxpUserLesson.user_fb || null,
          legacy_lesson_fb: lxpUserLesson.lesson_fb || null,
        };

        newLMSUserLessonsForLMS.push(newLMSUserLessonsTmp);
      }
    }
    console.log(
      'Total de user_lessons transformados para carga hacia el LMS:',
      newLMSUserLessonsForLMS.length,
    );
  } catch (error: any) {
    console.error('** Error en la transformación', error.message);
  }
};

/**
 * Método para realizar la carga de user_lessons ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
  const knexVdmLms = serverGlobals.knexVdmLms;

  try {
    console.log('Cargando user_lessons en el LMS...');

    if (!newLMSUserLessonsForLMS.length) {
      console.log('No hay user_lessons nuevas para cargar en el LMS');
      return;
    }

    const chunkSize = 500;
    for (let i = 0; i < newLMSUserLessonsForLMS.length; i += chunkSize) {
      const chunk = newLMSUserLessonsForLMS.slice(i, i + chunkSize);

      console.log(`Insertando chunk ${i}`);
      await knexVdmLms('user_lessons').insert(chunk);
      await sleep(2000);
    }

    // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
    await sleep(2000);
  } catch (error: any) {
    console.log('** Error en la carga de user_lessons al LMS', error.message);
  }
};

/**
 * Método principal que coordina el pipeline de importación de user_lessons
 */
export const startUserLessonsPipeline = async () => {
  console.log('\n**************************************');
  console.log('Iniciando pipeline de user_lessons\n');

  try {
    // Inicio de extract
    await mainExtractFn();

    // Inicio de transform
    await mainTransformFn();

    // Inicio de load
    await mainLoadFn();

    console.log('\nPipeline de user_lessons finalizado');
    console.log('**************************************');
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
