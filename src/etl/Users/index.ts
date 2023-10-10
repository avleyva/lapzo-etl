import serverGlobals from '../../config/global_conf';
import { LXPUser, VdmLMSUser, VdmUser } from './users.types';
import {
  sleep,
  MAX_RECORDS_TO_INSERT,
  WAITNING_TIME_BETWEEN_LOADS,
} from '../../utils/utils';
import { getGenericUsers } from './users.utils';

let lxpUsers: LXPUser[]; // Usuarios de LXP
let vdmLMSUsers: VdmLMSUser[]; // Usuarios del LMS de VDM
let vdmUsers: VdmUser[]; // Usuarios de Voldemort

const newUsersForLMS: VdmLMSUser[] = [];
let lmsClientId: any;

const transformedUsersForLMS: VdmLMSUser[] = [];

/**
 * Método de extracción de usuarios de LXP
 */
const mainExtractFn = async () => {
  try {
    const knexLxp = serverGlobals.knexLxp;
    const knexVdmLms = serverGlobals.knexVdmLms;
    const knexVdm = serverGlobals.knexVdm;
    const clientSubdomain = serverGlobals.transformClient;

    lmsClientId = await knexVdmLms('clients')
      .select('id')
      .where('subdomain', clientSubdomain)
      .first();

    lxpUsers = await knexLxp('users_cl')
      .select('*')
      .where('client_id', clientSubdomain);

    // Se crean los usuarios genéricos para el LMS y se agregan a la lista de usuarios LXP, para que sean transformados y cargados al LMS
    const genericUsers: LXPUser[] = await getGenericUsers(clientSubdomain);
    lxpUsers = [...lxpUsers, ...genericUsers];

    console.log('Total de usuarios encontrados en LXP:', lxpUsers.length);

    vdmLMSUsers = await knexVdmLms('users')
      .select('users.*')
      .join('clients', 'clients.id', 'users.client_id')
      .where('clients.subdomain', clientSubdomain);

    console.log(
      'Total de usuarios encontrados en el LMS de VDM:',
      vdmLMSUsers.length,
    );

    vdmUsers = await knexVdm('users')
      .select('users.*', 'clients.id as client_id')
      .join('client_users', 'client_users.user_id', 'users.id')
      .join('clients', 'clients.id', 'client_users.client_id')
      .where('clients.subdomain', clientSubdomain);

    console.log(
      'Total de usuarios encontrados en la Plataforma Voldemort:',
      vdmUsers.length,
    );
  } catch (error: any) {
    console.log('** Error en la extracción', error.message);
    throw new Error(error.message);
  }
};

/**
 * Método para transformar los usuarios de LXP al LMS
 */
const mainTransformFn = async () => {
  const knexVdm = serverGlobals.knexVdm;
  const knexVdmLms = serverGlobals.knexVdmLms;
  const clientSubdomain = serverGlobals.transformClient;

  try {
    // Se obtienen todos los usuarios de LXP que aún no han sido agregados al LMS de VDM
    for (const lxpUser of lxpUsers) {
      const lmsUserTmp = vdmLMSUsers.find(
        (e: VdmLMSUser) => e.email.trim() === lxpUser.email.trim(),
      );

      const vdmUserTmp = vdmUsers.find(
        (e: VdmUser) => e.email === lxpUser.email,
      );

      const userRole =
        lxpUser.type === 'A'
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

      const newLMSUserTmp: VdmLMSUser = {
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

    console.log(
      'Total de usuarios transformados para carga hacia el LMS:',
      newUsersForLMS.length,
    );
  } catch (error: any) {
    console.error('** Error en la transformación', error.message);
  }
};

/**
 * Método para realizar la carga de usuarios ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
  const knexVdmLms = serverGlobals.knexVdmLms;

  let chunk: any = [];

  try {
    console.log('Cargando usuarios en el LMS...');

    if (!newUsersForLMS.length) {
      console.log('No hay usuarios nuevos para cargar en el LMS');
      return;
    }

    const totalChunks = Math.ceil(
      newUsersForLMS.length / MAX_RECORDS_TO_INSERT,
    );

    for (
      let i = 0, cont = 1;
      i < newUsersForLMS.length;
      i += MAX_RECORDS_TO_INSERT, cont++
    ) {
      // const chunk = newUsersForLMS.slice(i, i + MAX_RECORDS_TO_INSERT);
      chunk = newUsersForLMS.slice(i, i + MAX_RECORDS_TO_INSERT);

      console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
      await knexVdmLms('users').insert(chunk).onConflict('id').merge();
      chunk = [];

      // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
      await sleep(WAITNING_TIME_BETWEEN_LOADS);
    }
  } catch (error: any) {
    console.log('** Error en la carga de usuarios a Voldemort', error.message);
    console.log(JSON.stringify(chunk));
  }
};

/**
 * Método principal que coordina el pipeline de importación de usuarios
 */
export const startUsersPipeline = async () => {
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
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
