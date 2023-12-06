"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCatalogCourseLessonsQuestionsPipeline = void 0;
const global_conf_1 = __importDefault(require("../../../config/global_conf"));
const utils_1 = require("../../../utils/utils");
let lxpLessonQuestions;
let vdmLMSCoursesLessonsQuestions;
let lmsCourses; // Cursos del LMS de VDM
let lmsModules; // Módulos del LMS de VDM
let vdmCoursesLessons;
const newLessonQuestionsForLMS = [];
let lmsClient;
/**
 * Método de extracción de lecciones de LXP
 */
const mainExtractFn = async () => {
    try {
        const knexLxp = global_conf_1.default.knexLxp;
        const knexVdmLms = global_conf_1.default.knexVdmLms;
        const lmsClientCatalog = global_conf_1.default.catalogClient;
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
            .join('courses_lessons', 'courses_lessons.id', 'courses_lesson_questions.lesson_id')
            .where('courses_lessons.client_id', lmsClient.id);
        console.log('Total de preguntas de lecciones encontradas en el LMS:', vdmLMSCoursesLessonsQuestions.length);
        // Obtención de las preguntas de lecciones de LXP asociadas a las lecciones del LMS de VDM
        lxpLessonQuestions = await knexLxp('lesson_questions_tb')
            .select('lesson_questions_tb.*')
            .join('lessons_cl', 'lessons_cl.lesson_fb', 'lesson_questions_tb.lesson_fb')
            .whereIn('lessons_cl.lesson_fb', vdmCoursesLessons.map((c) => c.lesson_fb));
        console.log('Total de preguntas de lecciones en LXP asociadas a los cursos del LMS:', lxpLessonQuestions.length);
    }
    catch (error) {
        console.log('** Error en la extracción', error.message);
        throw new Error(error.message);
    }
};
/**
 * Método para transformar los lecciones de LXP al LMS
 */
const mainTransformFn = async () => {
    const knexVdm = global_conf_1.default.knexVdm;
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    const clientSubdomain = global_conf_1.default.transformClient;
    try {
        // Se obtienen todas las lecciones de LXP que aún no han sido agregadas al LMS de VDM
        for (const lxpLessonQuestion of lxpLessonQuestions) {
            const lmsLessonQuestionTmp = vdmLMSCoursesLessonsQuestions.find((e) => e.lesson_fb === lxpLessonQuestion.lesson_fb);
            if (!lmsLessonQuestionTmp) {
                const newLMSLessonQuestionTmp = {
                    lesson_id: vdmCoursesLessons.find((c) => c.lesson_fb === lxpLessonQuestion.lesson_fb).id,
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
                    legacy_lesson_fb: vdmCoursesLessons.find((c) => c.lesson_fb === lxpLessonQuestion.lesson_fb).lesson_fb,
                    legacy_question_fb: lxpLessonQuestion.question_fb,
                };
                newLessonQuestionsForLMS.push(newLMSLessonQuestionTmp);
            }
        }
        console.log('Total de preguntas de lecciones transformadas para carga hacia el LMS:', newLessonQuestionsForLMS.length);
    }
    catch (error) {
        console.error('** Error en la transformación', error.message);
    }
};
/**
 * Método para realizar la carga de preguntas de lecciones ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    let chunk = [];
    try {
        console.log('Cargando preguntas de lecciones en el LMS...');
        if (!newLessonQuestionsForLMS.length) {
            console.log('No hay preguntas de lecciones nuevas para cargar en el LMS');
            return;
        }
        const totalChunks = Math.ceil(newLessonQuestionsForLMS.length / utils_1.MAX_RECORDS_TO_INSERT);
        for (let i = 0, cont = 1; i < newLessonQuestionsForLMS.length; i += utils_1.MAX_RECORDS_TO_INSERT, cont++) {
            chunk = newLessonQuestionsForLMS.slice(i, i + utils_1.MAX_RECORDS_TO_INSERT);
            console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
            await knexVdmLms('courses_lesson_questions').insert(newLessonQuestionsForLMS);
            chunk = [];
            // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
            await (0, utils_1.sleep)(utils_1.WAITNING_TIME_BETWEEN_LOADS);
        }
    }
    catch (error) {
        console.log('** Error en la carga de Course Lessons al LMS', error.message);
    }
};
/**
 * Método principal que coordina el pipeline de importación de preguntas de lecciones
 */
const startCatalogCourseLessonsQuestionsPipeline = async () => {
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
    }
    catch (error) {
        console.error('Pipeline interrumpido por Excepción:', error.message);
    }
};
exports.startCatalogCourseLessonsQuestionsPipeline = startCatalogCourseLessonsQuestionsPipeline;
//# sourceMappingURL=index.js.map