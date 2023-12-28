import serverGlobals from '../../../config/global_conf';
import { LXPCourse, VdmLMSCourse } from './courses.types';
import { VdmLMSUser } from '../../Users/users.types';
import {
  sleep,
  MAX_RECORDS_TO_INSERT,
  WAITNING_TIME_BETWEEN_LOADS,
} from '../../../utils/utils';
import { getCourseAuthor, getCourseDifficulty } from './courses.utils';

let lxpCourses: LXPCourse[]; // Cursos de LXP
let vdmLMSCourses: VdmLMSCourse[]; // Cursos del LMS de VDM
let vdmLMSUsers: VdmLMSUser[]; // Usuarios del LMS de VDM

const newCoursesForLMS: VdmLMSCourse[] = [];
let lmsClient: any;

const transformedCoursesForLMS: VdmLMSCourse[] = [];

/**
 * Método de extracción de usuarios de LXP
 */
const mainExtractFn = async () => {
  try {
    const knexLxp = serverGlobals.knexLxp;
    const knexVdmLms = serverGlobals.knexVdmLms;
    const clientSubdomain = serverGlobals.transformClient;
    const lmsClientCatalog = serverGlobals.catalogClient;
    const catalogOriginRaw = serverGlobals.catalogOriginRaw;

    // Se obtiene el ID del cliente en el LMS de VDM
    lmsClient = await knexVdmLms('clients')
      .select('id')
      .where('subdomain', lmsClientCatalog)
      .first();

    // Se obtienen los usuarios del LMS para recuperación de autores
    vdmLMSUsers = await knexVdmLms('users')
      .select('users.*')
      .join('clients', 'clients.id', 'users.client_id')
      .where('clients.subdomain', lmsClientCatalog);

    // Se obtienen todos los cursos de LXP con stage >= 7 y que tengan usuarios inscritos,
    // para descartar lo que pueden ser cursos de prueba. Es probable que un cliente quiera recuperar algunos de estos cursos sin inscritos
    lxpCourses = await knexLxp('courses_cl')
      .select('*')
      .where('client_id', 'content')
      .andWhere('courses_cl.stage', '>=', 7)
      .andWhereRaw(catalogOriginRaw);
    // .limit(110);

    console.log('Total de cursos encontrados en LXP:', lxpCourses.length);

    vdmLMSCourses = await knexVdmLms('courses')
      .select('courses.*')
      .join('clients', 'clients.id', 'courses.client_id')
      .where('clients.subdomain', lmsClientCatalog);

    console.log(
      'Total de cursos encontrados en el LMS de VDM:',
      vdmLMSCourses.length,
    );
  } catch (error: any) {
    console.log('** Error en la extracción', error.message);
    throw new Error(error.message);
  }
};

/**
 * Método para transformar los cursos de LXP al LMS
 */
const mainTransformFn = async () => {
  const knexVdm = serverGlobals.knexVdm;
  const knexVdmLms = serverGlobals.knexVdmLms;
  const clientSubdomain = serverGlobals.transformClient;
  const lmsClientCatalog = serverGlobals.catalogClient;

  try {
    // Se obtienen todos los cursos de LXP que aún no han sido agregados al LMS de VDM
    for (const lxpCourse of lxpCourses) {
      const lmsCourseTmp = vdmLMSCourses.find(
        (e: VdmLMSCourse) => e.legacy_course_fb === lxpCourse.course_fb,
      );

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
          origin: !lxpCourse.origin ? 'lapzo' : lxpCourse.origin,
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

        const newLMSCourseTmp: VdmLMSCourse = {
          client_id: lmsClient.id,
          author_id: await getCourseAuthor(
            lmsClientCatalog,
            lxpCourse.created_by_json || '{}',
            vdmLMSUsers,
          ),
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
          difficulty: getCourseDifficulty(lxpCourse.difficulty || 1),
          validity: lxpCourse.validity || 'na',
        };

        newCoursesForLMS.push(newLMSCourseTmp);
      }
    }
    console.log(
      'Total de cursos transformados para carga hacia el LMS:',
      newCoursesForLMS.length,
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
    console.log('Cargando cursos en el LMS...');

    if (!newCoursesForLMS.length) {
      console.log('No hay cursos nuevos para cargar en el LMS');
      return;
    }

    const totalChunks = Math.ceil(
      newCoursesForLMS.length / MAX_RECORDS_TO_INSERT,
    );

    for (
      let i = 0, cont = 1;
      i < newCoursesForLMS.length;
      i += MAX_RECORDS_TO_INSERT, cont++
    ) {
      chunk = newCoursesForLMS.slice(i, i + MAX_RECORDS_TO_INSERT);

      console.log(`Insertando chunk ${cont} de ${totalChunks}...`);
      await knexVdmLms('courses').insert(chunk);
      chunk = [];

      // Damos un poco de oxigeno a la base de datos para procesar los inserts y no saturarla
      await sleep(WAITNING_TIME_BETWEEN_LOADS);
    }
  } catch (error: any) {
    console.log('** Error en la carga de cursos a Voldemort', error.message);
  }
};

/**
 * Método principal que coordina el pipeline de importación de cursos
 */
export const startCatalogCoursesPipeline = async () => {
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
  } catch (error: any) {
    console.error('Pipeline interrumpido por Excepción:', error.message);
  }
};
