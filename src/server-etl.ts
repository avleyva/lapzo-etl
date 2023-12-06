import rp from 'request-promise';
import { getGCPSecrets } from './config/db';
import serverGlobals from './config/global_conf';
// import { extractLXPCompetencies } from './etl/Competencias';
import { startUsersPipeline } from './etl/Users';
import { startCoursesPipeline } from './etl/GestionCursos/Courses';
import * as etlCompetencies from './etl/Competencias';
import { startModulesPipeline } from './etl/GestionCursos/Modules';
import { startLessonsPipeline } from './etl/GestionCursos/Lessons';
import { startCourseLessonsPipeline } from './etl/GestionCursos/Courses_Lessons';
import { startCourseLessonsQuestionsPipeline } from './etl/GestionCursos/Courses_Lesson_Questions';
import { startUserCoursesPipeline } from './etl/TomaCursos/User_Courses';
import { startUserModulesPipeline } from './etl/TomaCursos/User_Modules';
import { startUserLessonsPipeline } from './etl/TomaCursos/User_Lessons';
import { startCourseLessonsResourcesPipeline } from './etl/GestionCursos/Courses_Lesson_Resources';
import { startCatalogCoursesPipeline } from './etl/CatalogoCursos/Courses';
import { startCatalogModulesPipeline } from './etl/CatalogoCursos/Modules';
import { startCatalogCourseLessonsPipeline } from './etl/CatalogoCursos/Courses_Lessons';
import { startCatalogCourseLessonsQuestionsPipeline } from './etl/CatalogoCursos/Courses_Lesson_Questions';

const run = async () => {
  serverGlobals.transformClient = 'cat-lapzo';
  // serverGlobals.transformClient = 'btconsortium';

  serverGlobals.catalogClient = 'cat-lapzo';

  /*************************************
   * Se establecen las conexiones globales a la DB
   */
  await getGCPSecrets();

  /*************************************
   * Inicia el Pipeline del ETL
   */
  // await startLessonsPipeline();
  // await etlCompetencies.startCompetenciesPipeline();

  // Inicio de pipelines generales
  await startUsersPipeline();

  // Inicio de pipelines de Gestion de Cursos
  // await startCoursesPipeline();
  // await startModulesPipeline();
  // await startCourseLessonsPipeline();
  // await startCourseLessonsQuestionsPipeline();
  // await startCourseLessonsResourcesPipeline();

  // Inicio de pipelines de Toma de Cursos
  // await startUserCoursesPipeline();
  // await startUserModulesPipeline();
  // await startUserLessonsPipeline();

  // Inicio de pipelines de Gestion de Cursos de Catálogo (Marketplace)
  await startCatalogCoursesPipeline();
  await startCatalogModulesPipeline();
  await startCatalogCourseLessonsPipeline();
  await startCatalogCourseLessonsQuestionsPipeline();

  /**
   * Al final se cierran las conexiones globales a la DB
   */
  serverGlobals.knexLxp.destroy();
  // serverGlobals.knexLxpRepl1.destroy();
  serverGlobals.knexVdm.destroy();

  console.log('\n**** ETL finalizado exitosamente! ****\n');

  process.exit(0);
};

run();
