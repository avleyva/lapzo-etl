import serverGlobals from '../../config/global_conf';
import {
  LXPClient,
  LXPCompetency,
  VoldemortCompetency,
} from './competencies.types';
import { sleep } from '../../utils/utils';

let vdmClient: LXPClient;
let lxpCompetencies: LXPCompetency[];
const newCompetenciesForVDM: VoldemortCompetency[] = [];

/**
 * Método de extracción de competencias de LXP
 */
const extractLXPCompetencies = async () => {
  try {
    const knexLxp = serverGlobals.knexLxp;
    const clientId = serverGlobals.transformClient;

    lxpCompetencies = await knexLxp('competencies_cl')
      .select('*')
      .where('client_id', clientId)
      .limit(3);

    console.log(
      'Total de competencias encontradas en LXP:',
      lxpCompetencies.length,
    );
  } catch (error: any) {
    console.log('** Error en la extracción', error.message);
    throw new Error(error.message);
  }
};

/**
 * Método para transformar las competencias de LXP a Voldemort
 */
const transformCompetenciesToVoldemort = async () => {
  const knexInstanceVoldemort = serverGlobals.knexVdm;
  // const vdmCoincidentes: VoldemortCompetency[] = [];
  // const vdmNewCompetencies: VoldemortCompetency[] = [];

  try {
    const vdmCurCompetencies = await knexInstanceVoldemort('competencies')
      .select('*')
      .where('client_id', vdmClient.id);

    // Se obtienen las competencias de VDM coincidentes en LXP
    // for (const competency of vdmCurCompetencies) {
    //   const competencyCoincidence = lxpCompetencies.find(
    //     (e) => e.name.trim() === competency.name.trim(),
    //   );
    //   if (competencyCoincidence) {
    //     vdmCoincidentes.push(competency);
    //   }
    // }

    // Se obtienen las competencias de LXP que no coinciden en VDM
    for (const competency of lxpCompetencies) {
      const competencyCoincidence = vdmCurCompetencies.find(
        (e: LXPCompetency) => e.name.trim() === competency.name.trim(),
      );
      if (!competencyCoincidence) {
        if (!competencyCoincidence) {
          // En caso de que la competencia no exista en VDM, se inserta
          const newVdmCompetencyTmp: VoldemortCompetency = {
            client_id: vdmClient.id,
            name: competency.name.trim(),
            description: '',
            dynamic: false,
            deleted: false,
            updated: false,
            custom_levels: true,
            max_level: 4,
            created_at: competency.created_at,
            updated_at: competency.updated_at,
            general_evaluation: false,
          };

          newCompetenciesForVDM.push(newVdmCompetencyTmp);
        }
      }
    }
  } catch (error: any) {
    console.log('** Error en la transformación', error.message);
  }
};

const loadCompetenciesToVoldemort = async () => {
  const knexInstanceVoldemort = serverGlobals.knexVdm;
  const knexLxp = serverGlobals.knexLxp;

  console.log(
    'Total de competencias a insertar en Voldemort:',
    newCompetenciesForVDM.length,
  );

  for (const competency of newCompetenciesForVDM) {
    try {
      // Se realiza la inserción 1 a 1 para evitar errores de concurrencia
      const newVdmCompetency = await knexInstanceVoldemort('competencies')
        .insert(competency)
        .returning('id');

      // Se aprovecha para que las competencias de LXP queden actualizadas con el ID de VDM
      await knexLxp('competencies_cl').where({ id: competency.id }).update({
        name: competency.name.trim(),
        voldemort_id: newVdmCompetency[0].id,
      });

      console.log(
        `Se inserta competencia en VDM: [${competency.name.trim()}] - [${
          newVdmCompetency[0].id
        }]}`,
      );

      await sleep(3000);
    } catch (error: any) {
      console.log(
        '** Error en la carga de competencias a Voldemort',
        error.message,
      );
    }
  }
};

/**
 * Método principal que coordina el pipeline de importación de competencias
 */
export const startCompetenciesPipeline = async () => {
  console.log('\n**************************************');
  console.log('Iniciando pipeline de competencias\n');

  try {
    const clientId = serverGlobals.transformClient;
    const knexInstanceVoldemort = serverGlobals.knexVdm;
    vdmClient = await knexInstanceVoldemort('clients')
      .select('id')
      .where('subdomain', clientId)
      .first();

    // Inicio de extract
    await extractLXPCompetencies();

    // Inicio de transform
    await transformCompetenciesToVoldemort();

    // Inicio de load
    await loadCompetenciesToVoldemort();

    console.log('\nPipeline de competencias finalizado');
    console.log('**************************************');
  } catch (error: any) {
    console.log('** Pipeline interrumpido por Excepción');
  }
};
