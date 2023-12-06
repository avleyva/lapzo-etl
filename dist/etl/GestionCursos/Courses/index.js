"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCoursesPipeline = void 0;
const global_conf_1 = __importDefault(require("../../../config/global_conf"));
const utils_1 = require("../../../utils/utils");
const courses_utils_1 = require("./courses.utils");
let lxpCourses; // Cursos de LXP
let vdmLMSCourses; // Cursos del LMS de VDM
let vdmLMSUsers; // Usuarios del LMS de VDM
const newCoursesForLMS = [];
let lmsClient;
const transformedCoursesForLMS = [];
/**
 * Método de extracción de usuarios de LXP
 */
const mainExtractFn = async () => {
    try {
        const knexLxp = global_conf_1.default.knexLxp;
        const knexVdmLms = global_conf_1.default.knexVdmLms;
        const knexVdm = global_conf_1.default.knexVdm;
        const clientSubdomain = global_conf_1.default.transformClient;
        // Se obtiene el ID del cliente en el LMS de VDM
        lmsClient = await knexVdmLms('clients')
            .select('id')
            .where('subdomain', clientSubdomain)
            .first();
        // Se obtienen los usuarios del LMS para recuperación de autores
        vdmLMSUsers = await knexVdmLms('users')
            .select('users.*')
            .join('clients', 'clients.id', 'users.client_id')
            .where('clients.subdomain', clientSubdomain);
        // Se obtienen todos los cursos de LXP con stage >= 7 y que tengan usuarios inscritos,
        // para descartar lo que pueden ser cursos de prueba. Es probable que un cliente quiera recuperar algunos de estos cursos sin inscritos
        lxpCourses = await knexLxp('courses_cl')
            .select('*')
            .where('client_id', clientSubdomain)
            .andWhere('courses_cl.stage', '>=', 7).andWhereRaw(`
        course_fb IN (
	        SELECT DISTINCT user_course_cl.course_fb
		      FROM user_course_cl
		      WHERE course_fb IN (
			      SELECT course_fb
			      FROM courses_cl
			      WHERE client_id = '${clientSubdomain}'
		      )
        )
      `);
        console.log('Total de cursos encontrados en LXP:', lxpCourses.length);
        vdmLMSCourses = await knexVdmLms('courses')
            .select('courses.*')
            .join('clients', 'clients.id', 'courses.client_id')
            .where('clients.subdomain', clientSubdomain);
        console.log('Total de cursos encontrados en el LMS de VDM:', vdmLMSCourses.length);
    }
    catch (error) {
        console.log('** Error en la extracción', error.message);
        throw new Error(error.message);
    }
};
/**
 * Método para transformar los cursos de LXP al LMS
 */
const mainTransformFn = async () => {
    const knexVdm = global_conf_1.default.knexVdm;
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    const clientSubdomain = global_conf_1.default.transformClient;
    try {
        // Se obtienen todos los cursos de LXP que aún no han sido agregados al LMS de VDM
        for (const lxpCourse of lxpCourses) {
            const lmsCourseTmp = vdmLMSCourses.find((e) => e.legacy_course_fb === lxpCourse.course_fb);
            if (!lmsCourseTmp) {
                const courseFeatures = {
                    skills: lxpCourse.skills_json,
                    knowledge: lxpCourse.knowledge_json,
                    attributes: lxpCourse.attributes_json,
                    requirements: lxpCourse.requirements_json,
                };
                const courseLegacyInfo = {
                    lxp_id: lxpCourse.id,
                    client_id: lxpCourse.client_id,
                    type: lxpCourse.type,
                    stage: lxpCourse.stage,
                    image: lxpCourse.image_url,
                    min_score: lxpCourse.min_score,
                    min_progress: lxpCourse.min_progress,
                    privacy: lxpCourse.privacy,
                    dc3Available: lxpCourse.dc3Available,
                    dc4Available: lxpCourse.dc4Available,
                    dc3_data_json: lxpCourse.dc3_data_json,
                    dc4_data_json: lxpCourse.dc4_data_json,
                };
                const courseSettings = {
                    video: JSON.stringify(lxpCourse.video_json),
                    config: { min_attendance: lxpCourse.min_attendance || 0 },
                    pricing: {
                        price: lxpCourse.price || 0,
                        currency: lxpCourse.currency || 'USD',
                    },
                    scoring: {
                        min_score: lxpCourse.min_score || 0,
                        min_progress: lxpCourse.min_progress || 0,
                    },
                    messages: {
                        reason: lxpCourse.reason || '',
                        wellcome: lxpCourse.welcome_message || '',
                    },
                };
                const newLMSCourseTmp = {
                    client_id: lmsClient.id,
                    author_id: await courses_utils_1.getCourseAuthor(lxpCourse.client_id, lxpCourse.created_by_json || '{}', vdmLMSUsers),
                    name: lxpCourse.name,
                    description: lxpCourse?.description || '',
                    image_url: lxpCourse.image_url,
                    settings: JSON.stringify(courseSettings),
                    features: JSON.stringify(courseFeatures),
                    tags: JSON.stringify(lxpCourse.tags_json),
                    is_draft: lxpCourse.stage >= 7 ? false : true,
                    is_active: lxpCourse.hide || true,
                    is_private: lxpCourse.privacy === 'private' ? true : false,
                    stage: lxpCourse?.stage || 0,
                    duration: lxpCourse.duration,
                    created_at: lxpCourse.created_at,
                    updated_at: lxpCourse.updated_at || new Date().toISOString(),
                    deleted_at: lxpCourse.deleted_at || null,
                    legacy: JSON.stringify(courseLegacyInfo),
                    legacy_course_fb: lxpCourse.course_fb,
                    show_evaluation_feedback: lxpCourse.show_evation_feedback ? 1 : 0,
                    language: lxpCourse.language,
                    difficulty: courses_utils_1.getCourseDifficulty(lxpCourse.difficulty || 1),
                    validity: lxpCourse.validity || 'na',
                };
                newCoursesForLMS.push(newLMSCourseTmp);
            }
        }
        console.log('Total de cursos transformados para carga hacia el LMS:', newCoursesForLMS.length);
    }
    catch (error) {
        console.error('** Error en la transformación', error.message);
    }
};
/**
 * Método para realizar la carga de usuarios ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    try {
        console.log('Cargando cursos en el LMS...');
        if (!newCoursesForLMS.length) {
            console.log('No hay cursos nuevos para cargar en el LMS');
            return;
        }
        await knexVdmLms('courses').insert(newCoursesForLMS);
        // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
        await utils_1.sleep(2000);
    }
    catch (error) {
        console.log('** Error en la carga de cursos a Voldemort', error.message);
    }
};
/**
 * Método principal que coordina el pipeline de importación de cursos
 */
const startCoursesPipeline = async () => {
    console.log('\n**************************************');
    console.log('Iniciando pipeline de cursos\n');
    try {
        // Inicio de extract
        await mainExtractFn();
        // Inicio de transform
        await mainTransformFn();
        // Inicio de load
        await mainLoadFn();
        console.log('\nPipeline de cursos finalizado');
        console.log('**************************************');
    }
    catch (error) {
        console.error('Pipeline interrumpido por Excepción:', error.message);
    }
};
exports.startCoursesPipeline = startCoursesPipeline;
//# sourceMappingURL=index.js.map