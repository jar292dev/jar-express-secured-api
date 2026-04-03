import { Kysely, PostgresDialect, MysqlDialect, CamelCasePlugin } from 'kysely';
import { Pool } from 'pg';
import { createPool } from 'mysql2';
import { Database } from './database.types';
import { env } from '../config/env';

export class KyselyClient {
  private static instance: Kysely<Database>;

  static connect(): Kysely<Database> {
    const dbType = env.DB_TYPE;

    if (dbType === 'postgres') {
      KyselyClient.instance = new Kysely<Database>({
        dialect: new PostgresDialect({
          pool: new Pool({
            host: env.DB_HOST,
            port: Number(env.DB_PORT),
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            max: 10,
          }),
        }),
        plugins: [new CamelCasePlugin()], // Opcional: convierte snake_case a camelCase automáticamente
      });
    } else if (dbType === 'mariadb' || dbType === 'mysql') {
      KyselyClient.instance = new Kysely<Database>({
        dialect: new MysqlDialect({
          pool: createPool({
            host: env.DB_HOST,
            port: Number(env.DB_PORT),
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            connectionLimit: 10,
          }),
        }),
        plugins: [new CamelCasePlugin()], // Opcional: convierte snake_case a camelCase automáticamente
      });
    } else {
      throw new Error(`DB_TYPE "${dbType}" not supported.`);
    }

    return KyselyClient.instance;
  }

  static async disconnect(): Promise<void> {
    if (KyselyClient.instance) {
      await KyselyClient.instance.destroy();
    }
  }

  static getInstance(): Kysely<Database> {
    if (!KyselyClient.instance) {
      throw new Error('Kysely client not initialized. Call connect() first.');
    }
    return KyselyClient.instance;
  }

  static async ping(): Promise<void> {
    // Lanza un error si la BD no es accesible — falla rápido antes de abrir el servidor
    await KyselyClient.instance.selectFrom('notices').select('id').limit(1).execute();
  }
}
