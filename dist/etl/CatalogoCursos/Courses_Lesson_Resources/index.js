"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCatalogCourseLessonsResourcesPipeline = void 0;
const global_conf_1 = __importDefault(require("../../../config/global_conf"));
const utils_1 = require("../../../utils/utils");
const courses_lesson_resource_utils_1 = require("./courses_lesson_resource.utils");
let vdmLMSCoursesLessonsResources;
let lxpLessons;
let vdmLMSCoursesLessons;
let vdmCoursesLessons;
let lmsClient;
const newCourseLessonResourcesForLMS = [];
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
            .select('legacy_lesson_fb', 'id')
            .where('client_id', lmsClient.id);
        // Obtención de las lecciones en LXP que tienen una asociación en VDM
        lxpLessons = await knexLxp('lessons_cl')
            .select('lessons_cl.*')
            .whereIn('lessons_cl.lesson_fb', vdmCoursesLessons.map((c) => c.legacy_lesson_fb));
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
            const lmsCourseLessonTmp = vdmCoursesLessons.find((e) => e.legacy_lesson_fb == lxpLesson.lesson_fb);
            const lxpResourceObject = (0, courses_lesson_resource_utils_1.getLXPLessonResource)(lxpLesson);
            if (lxpResourceObject) {
                const newLMSCourseLessonResourceTmp = {
                    lesson_id: vdmCoursesLessons.find((c) => c.legacy_lesson_fb === lxpLesson.lesson_fb).id,
                    content: JSON.stringify(lxpResourceObject?.content || {}),
                    index: 0,
                    enabled: false,
                    created_at: lxpLesson.created_at,
                    updated_at: lxpLesson.updated_at,
                    type: lxpResourceObject?.type || 'err-unknown',
                };
                newCourseLessonResourcesForLMS.push(newLMSCourseLessonResourceTmp);
            }
        }
        console.log('Total de recursos de lecciones transformadas para carga hacia el LMS:', newCourseLessonResourcesForLMS.length);
    }
    catch (error) {
        console.error('** Error en la transformación', error.message);
    }
};
/**
 * Método para realizar la carga de recursos de lecciones ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    let chunk = [];
    try {
        console.log('Cargando recursos de lecciones en el LMS...');
        if (!newCourseLessonResourcesForLMS.length) {
            console.log('No hay recursos de lecciones nuevas para cargar en el LMS');
            return;
        }
        const totalChunks = Math.ceil(newCourseLessonResourcesForLMS.length / utils_1.MAX_RECORDS_TO_INSERT);
        for (let i = 0, cont = 1; i < newCourseLessonResourcesForLMS.length; i += utils_1.MAX_RECORDS_TO_INSERT, cont++) {
            chunk = newCourseLessonResourcesForLMS.slice(i, i + utils_1.MAX_RECORDS_TO_INSERT);
            console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
            await knexVdmLms('courses_lessons_resources')
                .insert(newCourseLessonResourcesForLMS)
                .onConflict(['lesson_id', 'type'])
                .ignore();
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
 * Método principal que coordina el pipeline de importación de recursos de lecciones
 */
const startCatalogCourseLessonsResourcesPipeline = async () => {
    console.log('\n**************************************');
    console.log('Iniciando pipeline de course_lessons_resources\n');
    try {
        // Se obtiene el ID del cliente en el LMS de VDM
        const knexVdmLms = global_conf_1.default.knexVdmLms;
        const clientSubdomain = global_conf_1.default.transformClient;
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
    }
    catch (error) {
        console.error('Pipeline interrumpido por Excepción:', error.message);
    }
};
exports.startCatalogCourseLessonsResourcesPipeline = startCatalogCourseLessonsResourcesPipeline;
//# sourceMappingURL=index.js.map