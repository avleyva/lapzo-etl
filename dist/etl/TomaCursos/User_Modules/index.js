"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startUserModulesPipeline = void 0;
const global_conf_1 = __importDefault(require("../../../config/global_conf"));
const utils_1 = require("../../../utils/utils");
let lxpUserModules;
let vdmLMSUserModules;
let lmsCourses; // Cursos del LMS de VDM
let lmsModules; // Módulos del LMS de VDM
let lmsLessons; // Lecciones del LMS de VDM
let lmsUsers; // Usuarios del LMS de VDM
let vdmCoursesLessons;
const newLMSUserModulesForLMS = [];
let lmsClient;
/**
 * Método de extracción de user_modules de LXP
 */
const mainExtractFn = async () => {
    try {
        const knexLxp = global_conf_1.default.knexLxp;
        const knexVdmLms = global_conf_1.default.knexVdmLms;
        const clientSubdomain = global_conf_1.default.transformClient;
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
        // Se obtienen los user_modules existentes en el LMS de VDM
        vdmLMSUserModules = await knexVdmLms('user_modules')
            .select('user_modules.*')
            .join('courses', 'courses.id', 'user_modules.course_id')
            .where('courses.client_id', lmsClient.id);
        console.log('Total de registros en contrados en user_modules en el LMS:', vdmLMSUserModules.length);
        /*********************************************************************
         * Extracción de información existente en el origen (LXP)
         */
        // Obtención de los user_modules existentes en LXP
        lxpUserModules = await knexLxp('users_modules_cl')
            .select('users_modules_cl.*')
            .whereIn('users_modules_cl.course_fb', lmsCourses.map((c) => c.legacy_course_fb));
        console.log('Total de registros encontrados en user_modules_cl en LXP:', lxpUserModules.length);
    }
    catch (error) {
        console.log('** Error en la extracción', error.message);
        throw new Error(error.message);
    }
};
/**
 * Método para transformar los user_modules de LXP al LMS
 */
const mainTransformFn = async () => {
    const knexVdm = global_conf_1.default.knexVdm;
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    const clientSubdomain = global_conf_1.default.transformClient;
    try {
        for (const lxpUserModule of lxpUserModules) {
            const lmsUserModuleTmp = vdmLMSUserModules.find((e) => e.legacy_module_fb === lxpUserModule.module_fb);
            if (!lmsUserModuleTmp) {
                const lmsUserIdTmp = lmsUsers.find((u) => u.legacy_user_fb === lxpUserModule.user_fb)
                    ?.id || null;
                const lastActivityInfo = {
                    update: lxpUserModule.last_update || null,
                    lesson_fb: lxpUserModule.last_lesson_fb || null,
                    lesson_type: lxpUserModule.last_lesson_type || null,
                    lesson_image_url: lxpUserModule.last_lesson_image_url || null,
                };
                const legacyInfo = {
                    user_fb: lxpUserModule.user_fb,
                    client_fb: null,
                    module_fb: lxpUserModule.module_fb,
                };
                const newLMSUserModuleTmp = {
                    user_id: lmsUserIdTmp,
                    module_id: lmsModules.find((m) => m.legacy_module_fb === lxpUserModule.module_fb)?.id || null,
                    progress: Number.parseFloat(lxpUserModule.progress?.toString() || '0'),
                    score: Number.parseInt(lxpUserModule.score?.toString() || '0'),
                    last_updated: lxpUserModule.last_update || null,
                    last_lesson_id: lmsLessons.find((l) => l.legacy_lesson_fb === lxpUserModule.last_lesson_fb)?.id || null,
                    last_activity: JSON.stringify(lastActivityInfo),
                    legacy: JSON.stringify(legacyInfo),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    deleted_at: null,
                    deleted_by: null,
                    course_id: lmsCourses.find((c) => c.legacy_course_fb === lxpUserModule.course_fb)?.id || null,
                    legacy_module_fb: lxpUserModule.module_fb,
                };
                newLMSUserModulesForLMS.push(newLMSUserModuleTmp);
            }
        }
        console.log('Total de user_modules transformados para carga hacia el LMS:', newLMSUserModulesForLMS.length);
    }
    catch (error) {
        console.error('** Error en la transformación', error.message);
    }
};
/**
 * Método para realizar la carga de user_modules ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    try {
        console.log('Cargando user_modules en el LMS...');
        if (!newLMSUserModulesForLMS.length) {
            console.log('No hay user_modules nuevas para cargar en el LMS');
            return;
        }
        await knexVdmLms('user_modules').insert(newLMSUserModulesForLMS);
        // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
        await (0, utils_1.sleep)(2000);
    }
    catch (error) {
        console.log('** Error en la carga de user_modules al LMS', error.message);
    }
};
/**
 * Método principal que coordina el pipeline de importación de user_modules
 */
const startUserModulesPipeline = async () => {
    console.log('\n**************************************');
    console.log('Iniciando pipeline de user_modules\n');
    try {
        // Inicio de extract
        await mainExtractFn();
        // Inicio de transform
        await mainTransformFn();
        // Inicio de load
        await mainLoadFn();
        console.log('\nPipeline de user_modules finalizado');
        console.log('**************************************');
    }
    catch (error) {
        console.error('Pipeline interrumpido por Excepción:', error.message);
    }
};
exports.startUserModulesPipeline = startUserModulesPipeline;
//# sourceMappingURL=index.js.map