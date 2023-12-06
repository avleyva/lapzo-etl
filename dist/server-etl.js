"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
const global_conf_1 = __importDefault(require("./config/global_conf"));
const Courses_1 = require("./etl/GestionCursos/Courses");
const run = async () => {
    global_conf_1.default.transformClient = 'content';
    // serverGlobals.transformClient = 'team';
    // serverGlobals.transformClient = 'btconsortium';
    global_conf_1.default.catalogClient = 'cat-lapzo';
    /*************************************
     * Se establecen las conexiones globales a la DB
     */
    await db_1.getGCPSecrets();
    /*************************************
     * Inicia el Pipeline del ETL
     */
    // await startLessonsPipeline();
    // await etlCompetencies.startCompetenciesPipeline();
    // Inicio de pipelines generales
    // await startUsersPipeline();
    // Inicio de pipelines de Gestion de Cursos
    await Courses_1.startCoursesPipeline();
    // await startModulesPipeline();
    // await startCourseLessonsPipeline();
    // await startCourseLessonsQuestionsPipeline();
    // await startCourseLessonsResourcesPipeline();
    // Inicio de pipelines de Toma de Cursos
    // await startUserCoursesPipeline();
    // await startUserModulesPipeline();
    // await startUserLessonsPipeline();
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