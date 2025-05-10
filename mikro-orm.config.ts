import { defineConfig } from '@mikro-orm/postgresql';
import { RequestLog } from './entities/RequestLog';
import * as path from 'path';

import dotenv from 'dotenv';
dotenv.config();



export default defineConfig({
  // Use only the connection string for cloud-hosted PostgreSQL
  clientUrl: process.env.DB_URL ,

   pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 15000, // 15 seconds timeout
    createTimeoutMillis: 15000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 60000, // Connection timeout after 1 minute idle
    reapIntervalMillis: 1000, // Check for idle connections every 1 second
    createRetryIntervalMillis: 200, // Retry creating connection after 200ms
  },
  
  // Set generous timeout
  // Removed connectionTimeout as it is not a valid property
  
  // Comment out individual connection parameters 
  // host: process.env.DB_HOST,
  // port: +process.env.DB_PORT!, 
  // user: process.env.DB_USER,
  // password: process.env.DB_PASS,
  // dbName: process.env.DB_NAME,
  
  // SSL configuration is often needed for cloud DB providers
  driverOptions: {
    connection: {
      ssl: {
        rejectUnauthorized: false
      }
    }
  },
  
  entities: [RequestLog],
  migrations: {
    path: path.join(__dirname, './migrations'),
    tableName: 'mikro_orm_migrations',
  },
  seeder: {
    path: path.join(__dirname, './seeders'),
  },
  debug: true,
});