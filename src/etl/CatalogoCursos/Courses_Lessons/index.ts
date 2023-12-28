import serverGlobals from '../../../config/global_conf';
import { LXPLesson, VdmLMSCourseLesson } from './courses_lessons.types';
import {
  sleep,
  MAX_RECORDS_TO_INSERT,
  WAITNING_TIME_BETWEEN_LOADS,
} from '../../../utils/utils';
import { VdmLMSCourse } from '../Courses/courses.types';
import { VdmLMSModule } from '../Modules/modules.types';
import { getLessonSubType, getLessonType } from './courses_lessons.utils';

let lxpLessons: LXPLesson[];
let vdmLMSCoursesLessons: VdmLMSCourseLesson[];

let lmsCourses: VdmLMSCourse[]; // Cursos del LMS de VDM
let lmsModules: VdmLMSModule[]; // Módulos del LMS de VDM

const newLessonsForLMS: VdmLMSCourseLesson[] = [];
let lmsClient: any;

/**
 * Método de extracción de lecciones de LXP
 */
const mainExtractFn = async () => {
  try {
    const knexLxp = serverGlobals.knexLxp;
    const knexVdmLms = serverGlobals.knexVdmLms;
    const lmsClientCatalog = serverGlobals.catalogClient;

    // Se obtiene el ID del cliente en el LMS de VDM
    lmsClient = await knexVdmLms('clients')
      .select('id')
      .where('subdomain', lmsClientCatalog)
      .first();

    // Obtención de los IDs de cursos existentes en el LMS de VDM
    lmsCourses = await knexVdmLms('courses')
      .select('legacy_course_fb AS course_fb', 'id')
      .where('client_id', lmsClient.id);

    // Obtención de los IDs de módulos existentes en el LMS de VDM
    lmsModules = await knexVdmLms('courses_modules')
      .select('legacy_module_fb AS module_fb', 'courses_modules.id')
      .join('courses', 'courses.id', 'courses_modules.course_id')
      .where('client_id', lmsClient.id);

    // Se obtienen las lecciones existentes en el LMS de VDM
    vdmLMSCoursesLessons = await knexVdmLms('courses_lessons')
      .select('legacy_lesson_fb AS lesson_fb')
      .where('client_id', lmsClient.id);

    console.log(
      'Total de courses lessons encontrados en el LMS:',
      vdmLMSCoursesLessons.length,
    );

    // Obtención de las lecciones de LXP asociadas a los cursos del LMS de VDM
    lxpLessons = await knexLxp('lessons_cl')
      .select('*')
      .whereIn(
        'lessons_cl.course_fb',
        lmsCourses.map((c: any) => c.course_fb),
      )
      .andWhere('lessons_cl.name', '<>', 'Foro general del curso');

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
  try {
    // Se obtienen todas las lecciones de LXP que aún no han sido agregadas al LMS de VDM
    for (const lxpLesson of lxpLessons) {
      const lmsCoursesLessonTmp = vdmLMSCoursesLessons.find(
        (e: any) => e.lesson_fb === lxpLesson.lesson_fb,
      );

      if (!lmsCoursesLessonTmp) {
        const lessonLegacyInfo = {
          lesson_fb: lxpLesson.lesson_fb,
          type: lxpLesson.type,
          subtype: lxpLesson.subtype,
          image_url: lxpLesson.image_url,
          topic_id: lxpLesson.topic_id,
          course_fb: lxpLesson.course_fb,
          hide: lxpLesson.hide,
          is_post: lxpLesson.is_post,
          is_deleted: lxpLesson.is_deleted,
          weighing: lxpLesson.weighing,
          weigth: lxpLesson.weight,
          index: lxpLesson.index,
        };
        const newLMSCourseLessonTmp: VdmLMSCourseLesson = {
          client_id: lmsClient.id,
          course_id:
            lmsCourses.find((c: any) => c.course_fb === lxpLesson.course_fb)
              ?.id || null,
          module_id:
            lmsModules.find((c: any) => c.module_fb === lxpLesson.module_id)
              ?.id || null,
          name: lxpLesson.name || '',
          description: lxpLesson.description || '',
          image_url: lxpLesson.image_url || '',
          message: lxpLesson.message || '',
          weighting: '{}', // TODO: Completar
          topic_id: null, // TODO: Ver cómo traer los topics de VDM
          is_draft: !lxpLesson.stage || lxpLesson?.stage < 3 ? false : true,
          is_active: false,
          is_private: lxpLesson.privacy || false,
          claps: lxpLesson.claps || 0,
          index: lxpLesson.index || 0,
          random: lxpLesson.random || false,
          hours: lxpLesson.hours || 0,
          minutes: lxpLesson.minutes || 0,
          restart_time: lxpLesson.restart_time || 0,
          question_to_evaluate: lxpLesson.eval_question_to_evaluate || 0,
          attempts: lxpLesson.eval_attempts || 0,
          users_to_evaluate: lxpLesson.users_to_evaluate || 0,
          rubric: lxpLesson.rubric || '',
          tags: JSON.stringify(lxpLesson.tags_json),
          created_at: lxpLesson.created_at,
          updated_at: lxpLesson.updated_at || lxpLesson.created_at,
          deleted_at: lxpLesson.deleted_at || null,
          legacy: JSON.stringify(lessonLegacyInfo),
          access: 'FREE',
          assign: lxpLesson.assign || 0,
          subtype: getLessonSubType(lxpLesson.subtype || ''),
          type: getLessonType(lxpLesson.type || '', lxpLesson.subtype || ''),
          auto_review_on_enrollment:
            lxpLesson.auto_review_on_enrollment || false,
          legacy_lesson_fb: lxpLesson.lesson_fb,
        };
        newLessonsForLMS.push(newLMSCourseLessonTmp);
      }
    }
    console.log(
      'Total de courses lecciones transformadas para carga hacia el LMS:',
      newLessonsForLMS.length,
    );
  } catch (error: any) {
    console.error('** Error en la transformación', error.message);
  }
};

/**
 * Método para realizar la carga de lecciones ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
  const knexVdmLms = serverGlobals.knexVdmLms;
  let chunk: any = [];

  try {
    console.log('Cargando courses lessons en el LMS...');
    if (!newLessonsForLMS.length) {
      console.log('No hay lecciones nuevas para cargar en el LMS');
      return;
    }

    const totalChunks = Math.ceil(
      newLessonsForLMS.length / MAX_RECORDS_TO_INSERT,
    );

    for (
      let i = 0, cont = 1;
      i < newLessonsForLMS.length;
      i += MAX_RECORDS_TO_INSERT, cont++
    ) {
      chunk = newLessonsForLMS.slice(i, i + MAX_RECORDS_TO_INSERT);

      console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
      await knexVdmLms('courses_lessons').insert(chunk);
      chunk = [];

      // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
      await sleep(WAITNING_TIME_BETWEEN_LOADS);
    }
  } catch (error: any) {
    console.log('** Error en la carga de Course Lessons al LMS', error.message);
  }
};

/**
 * Método principal que coordina el pipeline de importación de lecciones de cursos
 */
export const startCatalogCourseLessonsPipeline = async () => {
  console.log('\n**************************************');
  console.log('Iniciando pipeline de course_lessons\n');

  try {
    // Inicio de extract
    await mainExtractFn();

    // Inicio de transform
    await mainTransformFn();

    // Inicio de load
    await mainLoadFn();

    console.log('\nPipeline de course_lessons finalizado');
    console.log('**************************************');
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
