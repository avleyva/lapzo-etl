"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGCPSecrets = void 0;
const secret_manager_1 = require("@google-cloud/secret-manager");
const knex_1 = require("knex");
const global_conf_1 = __importDefault(require("./global_conf"));
const getGCPSecrets = async () => {
    const client = new secret_manager_1.SecretManagerServiceClient();
    const secretRaw = await client.accessSecretVersion({
        name: 'projects/378281898300/secrets/lernit-lxp-backend-prod/versions/latest',
    });
    const secretsJSON = JSON.parse(secretRaw[0]?.payload?.data?.toString() || '{}');
    /***************************************************************************
     * Ambiente de Producción
     */
    /**
     * LXP Producción
     */
    // const knexConfigLxp: Knex.Config = {
    //   client: 'pg',
    //   connection: {
    //     host: secretsJSON.databaseHost,
    //     port: 5432,
    //     user: secretsJSON.databaseUser,
    //     password: secretsJSON.databasePassword,
    //     database: secretsJSON.databaseSchema,
    //   },
    // };
    /**
     * LXP Replica 1 Producción
     */
    // const knexConfigLxpReplica1: Knex.Config = {
    //   client: 'pg',
    //   connection: {
    //     host: secretsJSON.databaseHostReadReplica1,
    //     port: 5432,
    //     user: secretsJSON.databaseUser,
    //     password: secretsJSON.databasePassword,
    //     database: secretsJSON.databaseSchema,
    //   },
    // };
    /**
     * LMS Producción
     */
    // const knexConfigVdmLms: Knex.Config = {
    //   client: 'pg',
    //   connection: {
    //     host: 'lapzo-lms-prod.ccbmbi2jqpeb.us-west-2.rds.amazonaws.com',
    //     port: 5432,
    //     user: 'postgres',
    //     password: 'zV5QsYz2KK7uFQMYaahf0xzL2Ny9IYf7',
    //     database: 'postgres',
    //   },
    // };
    /**
     * Voldemort Producción
     */
    // const knexConfigVdm: Knex.Config = {
    //   client: 'pg',
    //   connection: {
    //     host: secretsJSON.databaseHostVdm,
    //     port: 5432,
    //     user: secretsJSON.databaseUserVdm,
    //     password: secretsJSON.databasePasswordVdm,
    //     database: secretsJSON.databaseSchemaVdm,
    //   },
    // };
    /***************************************************************************
     * Ambiente de Local
     */
    /**
     * LXP Local
     */
    const knexConfigLxp = {
        client: 'pg',
        connection: {
            host: 'localhost',
            port: 5433,
            user: 'postgres',
            password: 'postgres',
            database: 'postgres',
        },
    };
    /**
     * LMS Local
     */
    const knexConfigVdmLms = {
        client: 'pg',
        connection: {
            host: 'localhost',
            port: 5436,
            user: 'postgres',
            password: 'postgres',
            database: 'postgres',
        },
    };
    /**
     * Voldemort Local
     */
    const knexConfigVdm = {
        client: 'pg',
        connection: {
            host: 'localhost',
            port: 5432,
            user: 'postgres',
            password: 'postgres',
            database: 'postgres',
        },
    };
    /***************************************************************************
     * Ambiente de QA
     */
    /**
     * LMS QA
     */
    // const knexConfigVdmLms: Knex.Config = {
    //   client: 'pg',
    //   connection: {
    //     host: 'lapzo-lms-dev.ccbmbi2jqpeb.us-west-2.rds.amazonaws.com',
    //     port: 5432,
    //     user: 'postgres',
    //     password: '1fZzNXBxOZ3r5aVMb9TszwoMfC76nrHk',
    //     database: 'postgres',
    //   },
    // };
    /***************************************************************************
     * Ambiente de Staging
     */
    /**
     * Voldemort LMS STG
     */
    // const knexConfigVdm: Knex.Config = {
    //   client: 'pg',
    //   connection: {
    //     host: 'lapzo-platform-stg.ccbmbi2jqpeb.us-west-2.rds.amazonaws.com',
    //     port: 5432,
    //     user: 'postgres',
    //     password: 'j23PjGjnkfJ479oNKZbh2ncXPhVJr3oc',
    //     database: 'postgres',
    //   },
    // };
    const knexInstanceLxp = knex_1.knex(knexConfigLxp);
    // const knexInstanceLxpReplica1 = knex(knexConfigLxpReplica1);
    const knexInstanceVdmLms = knex_1.knex(knexConfigVdmLms);
    const knexInstanceVdm = knex_1.knex(knexConfigVdm);
    global_conf_1.default.knexLxp = knexInstanceLxp;
    // serverGlobals.knexLxpRepl1 = knexInstanceLxpReplica1;
    global_conf_1.default.knexVdmLms = knexInstanceVdmLms;
    global_conf_1.default.knexVdm = knexInstanceVdm;
};
exports.getGCPSecrets = getGCPSecrets;
//# sourceMappingURL=db.js.map