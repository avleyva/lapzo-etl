import serverGlobals from '../../../config/global_conf';
import { LXPModule, VdmLMSModule } from './modules.types';
import { VdmLMSCourse } from '../Courses/courses.types';
import { getCourseId } from './modules.utils';
import {
  sleep,
  MAX_RECORDS_TO_INSERT,
  WAITNING_TIME_BETWEEN_LOADS,
} from '../../../utils/utils';

let lxpModules: LXPModule[];
let vdmLMSModules: VdmLMSModule[];

let lmsCourses: VdmLMSCourse[]; // Cursos del LMS de VDM

const newModulesForLMS: VdmLMSModule[] = [];
let lmsClient: any;

const transformedCoursesForLMS: VdmLMSModule[] = [];

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

    console.log('Total de cursos encontrados en el LMS:', lmsCourses.length);

    // Obtención de los módulos de LXP asociados a los cursos del LMS de VDM
    lxpModules = await knexLxp('module_cl')
      .select('*')
      .whereIn(
        'module_cl.course_fb',
        lmsCourses.map((c: any) => c.course_fb),
      );

    console.log(
      'Total de módulos en LXP asociados a los cursos del LMS:',
      lxpModules.length,
    );

    // Obtención de los módulos en el LMS de VDM asociados a los cursos del LMS de VDM
    vdmLMSModules = await knexVdmLms('courses_modules')
      .select('*')
      .whereIn(
        'courses_modules.legacy_module_fb',
        lxpModules.map((m: any) => m.module_fb),
      );

    console.log('Total de módulos en el LMS:', vdmLMSModules.length);
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
    // Se obtienen todos los módlos de LXP que aún no han sido agregados al LMS de VDM
    for (const lxpModule of lxpModules) {
      const lmsModuleTmp = vdmLMSModules.find(
        (e: VdmLMSModule) => e.legacy_module_fb === lxpModule.module_fb,
      );
      if (!lmsModuleTmp) {
        const moduleLegacyInfo = {
          course_fb: lxpModule.course_fb,
          module_fb: lxpModule.module_fb,
          deleted: lxpModule.deleted,
          deleted_at: lxpModule.deleted_at,
          index: lxpModule.index,
          accreditation: lxpModule.accreditation,
        };
        const newLMSModuleTmp: VdmLMSModule = {
          name: lxpModule.name,
          description: lxpModule.description || '',
          index: lxpModule.index,
          tags: '{}', // TODO: Averiguar qué es esto
          accreditation: lxpModule.accreditation,
          deleted_at: lxpModule.deleted_at,
          created_at: lxpModule.created_at,
          updated_at: lxpModule.updated_at,
          legacy_module_fb: lxpModule.module_fb,
          legacy_course_fb: lxpModule.course_fb,
          legacy: JSON.stringify(moduleLegacyInfo),
          course_id: getCourseId(lxpModule.course_fb, lmsCourses),
        };
        newModulesForLMS.push(newLMSModuleTmp);
      }
    }
    console.log(
      'Total de módulos transformados para carga hacia el LMS:',
      newModulesForLMS.length,
    );
  } catch (error: any) {
    console.error('** Error en la transformación', error.message);
  }
};

/**
 * Método para realizar la carga de módulos ya transformados hacia el LMS de VDM
 */
const mainLoadFn = async () => {
  const knexVdmLms = serverGlobals.knexVdmLms;
  let chunk: any = [];

  try {
    console.log('Cargando módulos en el LMS...');
    if (!newModulesForLMS.length) {
      console.log('No hay módulos nuevos para cargar en el LMS');
      return;
    }

    const totalChunks = Math.ceil(
      newModulesForLMS.length / MAX_RECORDS_TO_INSERT,
    );

    for (
      let i = 0, cont = 1;
      i < newModulesForLMS.length;
      i += MAX_RECORDS_TO_INSERT, cont++
    ) {
      chunk = newModulesForLMS.slice(i, i + MAX_RECORDS_TO_INSERT);

      console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
      await knexVdmLms('courses_modules').insert(chunk);
      chunk = [];

      // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
      await sleep(WAITNING_TIME_BETWEEN_LOADS);
    }
  } catch (error: any) {
    console.log('** Error en la carga de módulos a Voldemort', error.message);
  }
};

/**
 * Método principal que coordina el pipeline de importación de módulos
 */
export const startCatalogModulesPipeline = async () => {
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
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
