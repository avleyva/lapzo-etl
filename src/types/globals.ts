import { Knex, knex } from 'knex';

export type ServerGlobals = {
  transformClient: string;
  knexLxp: Knex.Config;
  knexLxpRepl1: Knex.Config;
  knexVdm: Knex.Config;
};
