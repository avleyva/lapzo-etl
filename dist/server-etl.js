"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const global_conf_1 = __importDefault(require("./config/global_conf"));
// import { extractLXPCompetencies } from './etl/Competencias';
const Users_1 = require("./etl/Users");
const Courses_1 = require("./etl/CatalogoCursos/Courses");
const Modules_1 = require("./etl/CatalogoCursos/Modules");
const run = async () => {
    global_conf_1.default.transformClient = 'cat-lapzo';
    // serverGlobals.transformClient = 'btconsortium';
    global_conf_1.default.catalogClient = 'cat-lapzo';
    /*************************************
     * Se establecen las conexiones globales a la DB
     */
    await (0, db_1.getGCPSecrets)();
    /*************************************
     * Inicia el Pipeline del ETL
     */
    // await startLessonsPipeline();
    // await etlCompetencies.startCompetenciesPipeline();
    // Inicio de pipelines generales
    await (0, Users_1.startUsersPipeline)();
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
    await (0, Courses_1.startCatalogCoursesPipeline)();
    await (0, Modules_1.startCatalogModulesPipeline)();
    /**
     * Al final se cierran las conexiones globales a la DB
     */
    global_conf_1.default.knexLxp.destroy();
    // serverGlobals.knexLxpRepl1.destroy();
    global_conf_1.default.knexVdm.destroy();
    console.log('\n**** ETL finalizado exitosamente! ****\n');
    process.exit(0);
};
run();
//# sourceMappingURL=server-etl.js.map