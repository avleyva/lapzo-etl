import serverGlobals from '../../../config/global_conf';
import {
  LXPLessonQuestion,
  VdmLMSCourseLessonQuestion,
} from './courses_lesson_questions.types';
import {
  sleep,
  MAX_RECORDS_TO_INSERT,
  WAITNING_TIME_BETWEEN_LOADS,
} from '../../../utils/utils';
import { VdmLMSCourse } from '../Courses/courses.types';
import { VdmLMSModule } from '../Modules/modules.types';

let lxpLessonQuestions: LXPLessonQuestion[];
let vdmLMSCoursesLessonsQuestions: VdmLMSCourseLessonQuestion[];

let lmsCourses: VdmLMSCourse[]; // Cursos del LMS de VDM
let lmsModules: VdmLMSModule[]; // Módulos del LMS de VDM

let vdmCoursesLessons: any[];

const newLessonQuestionsForLMS: VdmLMSCourseLessonQuestion[] = [];
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

    // Se obtienen las lecciones asociadas a los cursos del LMS de VDM
    vdmCoursesLessons = await knexVdmLms('courses_lessons')
      .select('legacy_lesson_fb as lesson_fb', 'id')
      .where('client_id', lmsClient.id);

    // Se obtienen las preguntas de lecciones existentes en el LMS de VDM
    vdmLMSCoursesLessonsQuestions = await knexVdmLms('courses_lesson_questions')
      .select('courses_lesson_questions.*')
      .join(
        'courses_lessons',
        'courses_lessons.id',
        'courses_lesson_questions.lesson_id',
      )
      .where('courses_lessons.client_id', lmsClient.id);

    console.log(
      'Total de preguntas de lecciones encontradas en el LMS:',
      vdmLMSCoursesLessonsQuestions.length,
    );

    // Obtención de las preguntas de lecciones de LXP asociadas a las lecciones del LMS de VDM
    lxpLessonQuestions = await knexLxp('lesson_questions_tb')
      .select('lesson_questions_tb.*')
      .join(
        'lessons_cl',
        'lessons_cl.lesson_fb',
        'lesson_questions_tb.lesson_fb',
      )
      .whereIn(
        'lessons_cl.lesson_fb',
        vdmCoursesLessons.map((c: any) => c.lesson_fb),
      )
      .whereNotIn(
        'lesson_questions_tb.question_fb',
        vdmLMSCoursesLessonsQuestions.map((c: any) => c.legacy_question_fb),
      );

    console.log(
      'Total de preguntas de lecciones en LXP asociadas a los cursos del LMS:',
      lxpLessonQuestions.length,
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
    for (const lxpLessonQuestion of lxpLessonQuestions) {
      const lmsLessonQuestionTmp = vdmLMSCoursesLessonsQuestions.find(
        (e: any) => e.lesson_fb === lxpLessonQuestion.lesson_fb,
      );
      if (!lmsLessonQuestionTmp) {
        const newLMSLessonQuestionTmp: VdmLMSCourseLessonQuestion = {
          lesson_id: vdmCoursesLessons.find(
            (c: any) => c.lesson_fb === lxpLessonQuestion.lesson_fb,
          ).id,
          type: lxpLessonQuestion.type,
          text: lxpLessonQuestion.text,
          index: lxpLessonQuestion.index,
          answer: lxpLessonQuestion.answer,
          image_url: lxpLessonQuestion.image_url,
          options: JSON.stringify(lxpLessonQuestion.options),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          mins: lxpLessonQuestion.mins,
          back: lxpLessonQuestion.back,
          secs: lxpLessonQuestion.secs,
          legacy_lesson_fb: vdmCoursesLessons.find(
            (c: any) => c.lesson_fb === lxpLessonQuestion.lesson_fb,
          ).lesson_fb,
          legacy_question_fb: lxpLessonQuestion.question_fb,
        };
        newLessonQuestionsForLMS.push(newLMSLessonQuestionTmp);
      }
    }
    console.log(
      'Total de preguntas de lecciones transformadas para carga hacia el LMS:',
      newLessonQuestionsForLMS.length,
    );
  } catch (error: any) {
    console.error('** Error en la transformación', error.message);
  }
};

/**
 * Método para realizar la carga de preguntas de lecciones ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
  const knexVdmLms = serverGlobals.knexVdmLms;
  let chunk: any = [];

  try {
    console.log('Cargando preguntas de lecciones en el LMS...');
    if (!newLessonQuestionsForLMS.length) {
      console.log('No hay preguntas de lecciones nuevas para cargar en el LMS');
      return;
    }
    const totalChunks = Math.ceil(
      newLessonQuestionsForLMS.length / MAX_RECORDS_TO_INSERT,
    );
    for (
      let i = 0, cont = 1;
      i < newLessonQuestionsForLMS.length;
      i += MAX_RECORDS_TO_INSERT, cont++
    ) {
      chunk = newLessonQuestionsForLMS.slice(i, i + MAX_RECORDS_TO_INSERT);
      console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
      await knexVdmLms('courses_lesson_questions').insert(chunk);
      chunk = [];
      // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
      await sleep(WAITNING_TIME_BETWEEN_LOADS);
    }
  } catch (error: any) {
    console.log('** Error en la carga de Course Lessons al LMS', error.message);
  }
};

/**
 * Método principal que coordina el pipeline de importación de preguntas de lecciones
 */
export const startCatalogCourseLessonsQuestionsPipeline = async () => {
  console.log('\n**************************************');
  console.log('Iniciando pipeline de course_lessons_questions\n');

  try {
    // Inicio de extract
    await mainExtractFn();

    // Inicio de transform
    await mainTransformFn();

    // Inicio de load
    await mainLoadFn();

    console.log('\nPipeline de course_lessons_questions finalizado');
    console.log('**************************************');
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
