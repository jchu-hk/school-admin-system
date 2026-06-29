import { DataSource } from 'typeorm';
import { CamelCaseNamingStrategy } from './database/camel-case.strategy';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.development') });

// Use .js files for compiled code, .ts for development
const extension = __filename.endsWith('.js') ? '.js' : '.ts';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'school_admin',
  entities: [resolve(__dirname, 'modules/**/*entity' + extension)],
  migrations: [resolve(__dirname, 'migrations/*' + extension)],
  synchronize: false,
  namingStrategy: new CamelCaseNamingStrategy(),
});
