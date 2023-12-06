"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startModulesPipeline = void 0;
const global_conf_1 = __importDefault(require("../../../config/global_conf"));
const modules_utils_1 = require("./modules.utils");
const utils_1 = require("../../../utils/utils");
let lxpModules;
let vdmLMSModules;
let lmsCourses; // Cursos del LMS de VDM
const newModulesForLMS = [];
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
            .select('legacy_course_fb AS course_fb', 'id')
            .where('client_id', lmsClient.id);
        console.log('Total de cursos encontrados en el LMS:', lmsCourses.length);
        // Obtención de los módulos de LXP asociados a los cursos del LMS de VDM
        lxpModules = await knexLxp('module_cl')
            .select('*')
            .whereIn('module_cl.course_fb', lmsCourses.map((c) => c.course_fb));
        console.log('Total de módulos en LXP asociados a los cursos del LMS:', lxpModules.length);
        // Obtención de los módulos en el LMS de VDM asociados a los cursos del LMS de VDM
        vdmLMSModules = await knexVdmLms('courses_modules')
            .select('*')
            .whereIn('courses_modules.legacy_module_fb', lxpModules.map((m) => m.module_fb));
        console.log('Total de módulos en el LMS:', vdmLMSModules.length);
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
        // Se obtienen todos los módlos de LXP que aún no han sido agregados al LMS de VDM
        for (const lxpModule of lxpModules) {
            const lmsModuleTmp = vdmLMSModules.find((e) => e.legacy_module_fb === lxpModule.module_fb);
            if (!lmsModuleTmp) {
                const moduleLegacyInfo = {
                    course_fb: lxpModule.course_fb,
                    module_fb: lxpModule.module_fb,
                    deleted: lxpModule.deleted,
                    deleted_at: lxpModule.deleted_at,
                    index: lxpModule.index,
                    accreditation: lxpModule.accreditation,
                };
                const newLMSModuleTmp = {
                    name: lxpModule.name,
                    description: lxpModule.description || '',
                    index: lxpModule.index,
                    tags: '{}',
                    accreditation: lxpModule.accreditation,
                    deleted_at: lxpModule.deleted_at,
                    created_at: lxpModule.created_at,
                    updated_at: lxpModule.updated_at,
                    legacy_module_fb: lxpModule.module_fb,
                    legacy_course_fb: lxpModule.course_fb,
                    legacy: JSON.stringify(moduleLegacyInfo),
                    course_id: modules_utils_1.getCourseId(lxpModule.course_fb, lmsCourses),
                };
                newModulesForLMS.push(newLMSModuleTmp);
            }
        }
        console.log('Total de módulos transformados para carga hacia el LMS:', newModulesForLMS.length);
    }
    catch (error) {
        console.error('** Error en la transformación', error.message);
    }
};
/**
 * Método para realizar la carga de módulos ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    try {
        console.log('Cargando módulos en el LMS...');
        if (!newModulesForLMS.length) {
            console.log('No hay módulos nuevos para cargar en el LMS');
            return;
        }
        await knexVdmLms('courses_modules').insert(newModulesForLMS);
        // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
        await utils_1.sleep(2000);
    }
    catch (error) {
        console.log('** Error en la carga de módulos a Voldemort', error.message);
    }
};
/**
 * Método principal que coordina el pipeline de importación de módulos
 */
const startModulesPipeline = async () => {
    console.log('\n**************************************');
    console.log('Iniciando pipeline de módulos\n');
    try {
        // Inicio de extract
        await mainExtractFn();
        // Inicio de transform
        await mainTransformFn();
        // Inicio de load
        await mainLoadFn();
        console.log('\nPipeline de módulos finalizado');
        console.log('**************************************');
    }
    catch (error) {
        console.error('Pipeline interrumpido por Excepción:', error.message);
    }
};
exports.startModulesPipeline = startModulesPipeline;
//# sourceMappingURL=index.js.map