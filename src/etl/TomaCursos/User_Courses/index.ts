import serverGlobals from '../../../config/global_conf';
import {
  LXPUserCourse,
  VdmLMSUserCourse,
} from '../User_Courses/user_courses.types';
import { sleep } from '../../../utils/utils';
import { getUserCourseStatus } from './user_courses.utils';

let lxpUserCourses: LXPUserCourse[];
let vdmLMSUserCourses: VdmLMSUserCourse[];

let lmsCourses: any[]; // Cursos del LMS de VDM
let lmsUsers: any[]; // Usuarios del LMS de VDM

let vdmCoursesLessons: any[];

const newLMSUserCoursesForLMS: VdmLMSUserCourse[] = [];
let lmsClient: any;

/**
 * Método de extracción de user_courses de LXP
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

    // Se obtienen los usuarios asociados al cliente del LMS de VDM
    lmsUsers = await knexVdmLms('users')
      .select('id', 'email', 'legacy_user_fb')
      .where('client_id', lmsClient.id);

    /*********************************************************************
     * Extracción de información existenten en el destino (LMS de VDM)
     */
    // Se obtienen los user_courses existentes en el LMS de VDM
    vdmLMSUserCourses = await knexVdmLms('user_courses')
      .select('user_courses.*')
      .join(
        'courses',
        'courses.legacy_course_fb',
        'user_courses.legacy_course_fb',
      )
      .where('courses.client_id', lmsClient.id);

    console.log(
      'Total de registros en contrados en user_courses en el LMS:',
      vdmLMSUserCourses.length,
    );

    /*********************************************************************
     * Extracción de información existente en el origen (LXP)
     */
    // Obtención de las preguntas de lecciones de LXP asociadas a las lecciones del LMS de VDM
    lxpUserCourses = await knexLxp('user_course_cl')
      .select('user_course_cl.*')
      .whereIn(
        'user_course_cl.course_fb',
        lmsCourses.map((c: any) => c.legacy_course_fb),
      );

    console.log(
      'Total de registros encontrados en user_courses_cl en LXP:',
      lxpUserCourses.length,
    );
  } catch (error: any) {
    console.log('** Error en la extracción', error.message);
    throw new Error(error.message);
  }
};

/**
 * Método para transformar los user_courses de LXP al LMS
 */
const mainTransformFn = async () => {
  const knexVdm = serverGlobals.knexVdm;
  const knexVdmLms = serverGlobals.knexVdmLms;
  const clientSubdomain = serverGlobals.transformClient;

  try {
    for (const lxpUserCourse of lxpUserCourses) {
      const lmsUserCourseTmp = vdmLMSUserCourses.find(
        (e: any) =>
          e.legacy_course_fb === lxpUserCourse.course_fb &&
          e.legacy_user_fb === lxpUserCourse.user_fb,
      );

      if (!lmsUserCourseTmp) {
        const lmsUserIdTmp =
          lmsUsers.find((u: any) => u.legacy_user_fb === lxpUserCourse.user_fb)
            ?.id || null;

        if (!lmsUserIdTmp) {
          continue;
        }

        const scoringInfo = {
          score: lxpUserCourse.score,
          is_manual: lxpUserCourse.manual_score,
        };

        const activityInfo = {
          last_lesson: lxpUserCourse.last_lesson,
          last_module: lxpUserCourse.module_id,
          last_lesson_id: lxpUserCourse.last_lesson_id,
        };

        const accreditationInfo = {
          accredited: lxpUserCourse.accredited,
          accredited_at: lxpUserCourse.accreditation_date,
          accredited_by: null,
        };

        const abandoningInfo = {
          allowed: lxpUserCourse.can_unsubscribe,
          abandoned_at: lxpUserCourse.deserted_at,
          is_abandoned: lxpUserCourse.deserted_at ? true : false,
        };

        const legacyInfo = {
          user_fb: lxpUserCourse.user_fb,
          course_fb: lxpUserCourse.course_fb,
          course_id: lxpUserCourse.course_id,
          module_id: lxpUserCourse.module_id,
          group_id: lxpUserCourse.group_id,
          group_history: lxpUserCourse.group_history,
        };

        const newLMSUserCourseTmp: VdmLMSUserCourse = {
          client_id: lmsClient.id,
          course_id:
            lmsCourses.find(
              (c: any) => c.legacy_course_fb === lxpUserCourse.course_fb,
            ).id || null,
          user_id: lmsUserIdTmp,
          status: getUserCourseStatus(lxpUserCourse.status),
          progress: Number.parseFloat(lxpUserCourse.progress.toString()),
          completed_at: lxpUserCourse.completed_at,
          score: Number.parseInt(lxpUserCourse.score.toString()),
          scoring: JSON.stringify(scoringInfo),
          activity: JSON.stringify(activityInfo),
          last_update: lxpUserCourse.last_update,
          approved: lxpUserCourse.status === 'approved' ? true : false,
          approval: 'NULL', // TODO: Ver como obtener este dato
          created_at: lxpUserCourse.created_at,
          updated_at: lxpUserCourse.updated_at,
          deleted_by: null, // TODO: Se revisó LXP y este campo siempre es null
          deleted_at: lxpUserCourse.deserted_at,
          accreditation: JSON.stringify(accreditationInfo),
          abandoning: JSON.stringify(abandoningInfo),
          legacy: JSON.stringify(legacyInfo),
          group_fb: lxpUserCourse.group_id,
          legacy_user_fb: lxpUserCourse.user_fb,
          legacy_course_fb: lxpUserCourse.course_fb,
        };

        newLMSUserCoursesForLMS.push(newLMSUserCourseTmp);
      }
    }
    console.log(
      'Total de user_courses transformados para carga hacia el LMS:',
      newLMSUserCoursesForLMS.length,
    );
  } catch (error: any) {
    console.error('** Error en la transformación', error.message);
  }
};

/**
 * Método para realizar la carga de user_courses ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
  const knexVdmLms = serverGlobals.knexVdmLms;

  try {
    console.log('Cargando user_courses en el LMS...');

    if (!newLMSUserCoursesForLMS.length) {
      console.log('No hay user_courses nuevas para cargar en el LMS');
      return;
    }

    await knexVdmLms('user_courses').insert(newLMSUserCoursesForLMS);

    // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
    await sleep(2000);
  } catch (error: any) {
    console.log('** Error en la carga de user_courses al LMS', error.message);
  }
};

/**
 * Método principal que coordina el pipeline de importación de user_courses
 */
export const startUserCoursesPipeline = async () => {
  console.log('\n**************************************');
  console.log('Iniciando pipeline de user_courses\n');

  try {
    // Inicio de extract
    await mainExtractFn();

    // Inicio de transform
    await mainTransformFn();

    // Inicio de load
    await mainLoadFn();

    console.log('\nPipeline de user_courses finalizado');
    console.log('**************************************');
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
