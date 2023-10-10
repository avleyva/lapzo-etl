import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Knex, knex } from 'knex';
import serverGlobals from './global_conf';

export const getGCPSecrets = async () => {
  const client = new SecretManagerServiceClient();
  const secretRaw = await client.accessSecretVersion({
    name: 'projects/378281898300/secrets/lernit-lxp-backend-prod/versions/latest',
  });

  const secretsJSON = JSON.parse(
    secretRaw[0]?.payload?.data?.toString() || '{}',
  );

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
   * Voldemort LMS Producción
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
  const knexConfigLxp: Knex.Config = {
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
   * Voldemort LMS Local
   */
  const knexConfigVdmLms: Knex.Config = {
    client: 'pg',
    connection: {
      host: 'localhost',
      port: 5436, // LMS local
      user: 'postgres',
      password: 'postgres',
      database: 'postgres',
    },
  };

  /**
   * Voldemort Local
   */
  const knexConfigVdm: Knex.Config = {
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
   * Voldemort LMS QA
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

  const knexInstanceLxp = knex(knexConfigLxp);
  // const knexInstanceLxpReplica1 = knex(knexConfigLxpReplica1);
  const knexInstanceVdmLms = knex(knexConfigVdmLms);
  const knexInstanceVdm = knex(knexConfigVdm);

  serverGlobals.knexLxp = knexInstanceLxp;
  // serverGlobals.knexLxpRepl1 = knexInstanceLxpReplica1;
  serverGlobals.knexVdmLms = knexInstanceVdmLms;
  serverGlobals.knexVdm = knexInstanceVdm;
};
