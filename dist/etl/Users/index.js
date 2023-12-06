"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startUsersPipeline = void 0;
const global_conf_1 = __importDefault(require("../../config/global_conf"));
const utils_1 = require("../../utils/utils");
const users_utils_1 = require("./users.utils");
let lxpUsers; // Usuarios de LXP
let vdmLMSUsers; // Usuarios del LMS de VDM
let vdmUsers; // Usuarios de Voldemort
const newUsersForLMS = [];
let lmsClientId;
const transformedUsersForLMS = [];
/**
 * Método de extracción de usuarios de LXP
 */
const mainExtractFn = async () => {
    try {
        const knexLxp = global_conf_1.default.knexLxp;
        const knexVdmLms = global_conf_1.default.knexVdmLms;
        const knexVdm = global_conf_1.default.knexVdm;
        const clientSubdomain = global_conf_1.default.transformClient;
        lmsClientId = await knexVdmLms('clients')
            .select('id')
            .where('subdomain', clientSubdomain)
            .first();
        lxpUsers = await knexLxp('users_cl')
            .select('*')
            .where('client_id', clientSubdomain);
        // Se crean los usuarios genéricos para el LMS y se agregan a la lista de usuarios LXP, para que sean transformados y cargados al LMS
        const genericUsers = await users_utils_1.getGenericUsers(clientSubdomain);
        lxpUsers = [...lxpUsers, ...genericUsers];
        console.log('Total de usuarios encontrados en LXP:', lxpUsers.length);
        vdmLMSUsers = await knexVdmLms('users')
            .select('users.*')
            .join('clients', 'clients.id', 'users.client_id')
            .where('clients.subdomain', clientSubdomain);
        console.log('Total de usuarios encontrados en el LMS de VDM:', vdmLMSUsers.length);
        vdmUsers = await knexVdm('users')
            .select('users.*', 'clients.id as client_id')
            .join('client_users', 'client_users.user_id', 'users.id')
            .join('clients', 'clients.id', 'client_users.client_id')
            .where('clients.subdomain', clientSubdomain);
        console.log('Total de usuarios encontrados en la Plataforma Voldemort:', vdmUsers.length);
    }
    catch (error) {
        console.log('** Error en la extracción', error.message);
        throw new Error(error.message);
    }
};
/**
 * Método para transformar los usuarios de LXP al LMS
 */
const mainTransformFn = async () => {
    const knexVdm = global_conf_1.default.knexVdm;
    const knexVdmLms = global_conf_1.default.knexVdmLms;
    const clientSubdomain = global_conf_1.default.transformClient;
    try {
        // Se obtienen todos los usuarios de LXP que aún no han sido agregados al LMS de VDM
        for (const lxpUser of lxpUsers) {
            const lmsUserTmp = vdmLMSUsers.find((e) => e.email.trim() === lxpUser.email.trim());
            const vdmUserTmp = vdmUsers.find((e) => e.email === lxpUser.email);
            const userRole = lxpUser.type === 'A'
                ? 'ADMIN'
                : lxpUser.type === 'I'
                    ? 'INSTRUCTOR'
                    : lxpUser.type === 'L'
                        ? 'LITE'
                        : 'PARTICIPANT';
            const userProfile = {
                bio: lxpUser?.bio || '',
                hero_url: lxpUser?.hero_url || '',
                image_url: lxpUser?.image_url || '',
                type: lxpUser?.type || '',
                role: lxpUser?.role || '',
                ou: lxpUser?.ou || '',
            };
            const userLegacyInfo = {
                lxp_id: lxpUser?.id || null,
                user_fb: lxpUser?.user_fb || null,
            };
            const newLMSUserTmp = {
                client_id: lmsClientId?.id || null,
                email: lxpUser.email,
                first_name: lxpUser.first_name,
                last_name: lxpUser.last_name,
                profile: JSON.stringify(userProfile),
                created_at: lxpUser.created_at,
                updated_at: lxpUser.updated_at,
                deleted: lxpUser.deleted,
                deleted_at: lxpUser.deleted_at,
                ext_id: vdmUserTmp?.id || null,
                legacy_user_fb: lxpUser.user_fb,
                role: userRole,
                legacy: JSON.stringify(userLegacyInfo),
            };
            if (lmsUserTmp) {
                newLMSUserTmp.id = lmsUserTmp.id;
            }
            newUsersForLMS.push(newLMSUserTmp);
        }
        console.log('Total de usuarios transformados para carga hacia el LMS:', newUsersForLMS.length);
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
    let chunk = [];
    try {
        console.log('Cargando usuarios en el LMS...');
        if (!newUsersForLMS.length) {
            console.log('No hay usuarios nuevos para cargar en el LMS');
            return;
        }
        const totalChunks = Math.ceil(newUsersForLMS.length / utils_1.MAX_RECORDS_TO_INSERT);
        for (let i = 0, cont = 1; i < newUsersForLMS.length; i += utils_1.MAX_RECORDS_TO_INSERT, cont++) {
            // const chunk = newUsersForLMS.slice(i, i + MAX_RECORDS_TO_INSERT);
            chunk = newUsersForLMS.slice(i, i + utils_1.MAX_RECORDS_TO_INSERT);
            console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
            await knexVdmLms('users').insert(chunk).onConflict('id').merge();
            chunk = [];
            // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
            await utils_1.sleep(utils_1.WAITNING_TIME_BETWEEN_LOADS);
        }
    }
    catch (error) {
        console.log('** Error en la carga de usuarios a Voldemort', error.message);
        console.log(JSON.stringify(chunk));
    }
};
/**
 * Método principal que coordina el pipeline de importación de usuarios
 */
const startUsersPipeline = async () => {
    console.log('\n**************************************');
    console.log('Iniciando pipeline de usuarios\n');
    try {
        // Inicio de extract
        await mainExtractFn();
        // Inicio de transform
        await mainTransformFn();
        // Inicio de load
        await mainLoadFn();
        console.log('\nPipeline de usuarios finalizado');
        console.log('**************************************');
    }
    catch (error) {
        console.error('Pipeline interrumpido por Excepción:', error.message);
    }
};
exports.startUsersPipeline = startUsersPipeline;
//# sourceMappingURL=index.js.map