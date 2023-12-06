"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLessonsPipeline = void 0;
const global_conf_1 = __importDefault(require("../../../config/global_conf"));
const utils_1 = require("../../../utils/utils");
const lessons_utils_1 = require("./lessons.utils");
let lxpLessons;
let vdmLMSLessons;
let lmsCourses; // Cursos del LMS de VDM
const newLessonsForLMS = [];
let lmsClient;
const transformedCoursesForLMS = [];
/**
 * Método de extracción de lecciones de LXP
 */
const mainExtractFn = async () => {
    try {
        const knexLxp = global_conf_1.default.knexLxp;
        const knexVdmLms = global_conf_1.default.knexVdmLms;
        const clientSubdomain = global_conf_1.default.transformClient;
        // Se obtiene el ID del cliente en el LMS de VDM
        lmsClient = await knexVdmLms('clients')
            .select('id')
            .where('subdomain', clientSubdomain)
            .first();
        // Obtención de los IDs de cursos existentes en el LMS de VDM
        lmsCourses = await knexVdmLms('courses')
            .select('legacy_course_fb AS course_fb')
            .where('client_id', lmsClient.id);
        // Se obtienen las lecciones existentes en el LMS de VDM
        vdmLMSLessons = await knexVdmLms('lessons')
            .select('legacy_lesson_fb AS lesson_fb')
            .where('client_id', lmsClient.id);
        console.log('Total de lecciones encontrados en el LMS:', vdmLMSLessons.length);
        // Obtención de las lecciones de LXP asociadas a los cursos del LMS de VDM
        lxpLessons = await knexLxp('lessons_cl')
            .select('*')
            .whereIn('lessons_cl.course_fb', lmsCourses.map((c) => c.course_fb));
        console.log('Total de lecciones en LXP asociadas a los cursos del LMS:', lxpLessons.length);
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
        for (const lxpLesson of lxpLessons) {
            const lmsLessonTmp = vdmLMSLessons.find((e) => e.lesson_fb === lxpLesson.lesson_fb);
            if (!lmsLessonTmp) {
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
                const newLMSLessonTmp = {
                    client_id: lmsClient.id,
                    name: lxpLesson.name || '',
                    author_id: lxpLesson.created_by || null,
                    created_by: lxpLesson.created_by || null,
                    description: lxpLesson.description || '',
                    image_url: lxpLesson.image_url || '',
                    message: lxpLesson.message || '',
                    is_draft: !lxpLesson.stage || lxpLesson?.stage < 3 ? false : true,
                    is_active: false,
                    is_private: lxpLesson.privacy || false,
                    hours: lxpLesson.hours || 0,
                    minutes: lxpLesson.minutes || 0,
                    created_at: lxpLesson.created_at,
                    updated_at: lxpLesson.updated_at || lxpLesson.created_at,
                    deleted_at: lxpLesson.deleted_at || null,
                    resources: JSON.stringify(lxpLesson.resources_json),
                    legacy: JSON.stringify(lessonLegacyInfo),
                    auto_review_on_enrollment: lxpLesson.auto_review_on_enrollment || false,
                    type: lessons_utils_1.getLessonType(lxpLesson.type || '', lxpLesson.subtype || ''),
                    access: 'FREE',
                    legacy_lesson_fb: lxpLesson.lesson_fb,
                };
                newLessonsForLMS.push(newLMSLessonTmp);
            }
        }
        console.log('Total de lecciones transformadas para carga hacia el LMS:', newLessonsForLMS.length);
    }
    catch (error) {
        console.error('** Error en la transformación', error.message);
    }
};
/**
 * Método para realizar la carga de lecciones ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    try {
        console.log('Cargando cursos en el LMS...');
        if (!newLessonsForLMS.length) {
            console.log('No hay lecciones nuevas para cargar en el LMS');
            return;
        }
        const newVdmCompetency = await knexVdmLms('lessons').insert(newLessonsForLMS);
        // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
        await utils_1.sleep(2000);
    }
    catch (error) {
        console.log('** Error en la carga de lecciones a Voldemort', error.message);
    }
};
/**
 * Método principal que coordina el pipeline de importación de lecciones
 */
const startLessonsPipeline = async () => {
    console.log('\n**************************************');
    console.log('Iniciando pipeline de lecciones\n');
    try {
        // Inicio de extract
        await mainExtractFn();
        // Inicio de transform
        await mainTransformFn();
        // Inicio de load
        await mainLoadFn();
        console.log('\nPipeline de lecciones finalizado');
        console.log('**************************************');
    }
    catch (error) {
        console.error('Pipeline interrumpido por Excepción:', error.message);
    }
};
exports.startLessonsPipeline = startLessonsPipeline;
//# sourceMappingURL=index.js.map