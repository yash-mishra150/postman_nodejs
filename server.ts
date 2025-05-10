import express from 'express';
import cors from 'cors';
import { MikroORM } from '@mikro-orm/core';
import mikroConfig from './mikro-orm.config';
import logRoutes from './routes/logs';
import requestRoutes from './routes/requests';


import dotenv from 'dotenv';
dotenv.config();

const start = async () => {
  const orm = await MikroORM.init(mikroConfig);
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.set('em', orm.em.fork());

  app.use('/api', logRoutes);
  app.use('/api', requestRoutes);

  const generator = orm.getSchemaGenerator();
  await generator.updateSchema(); 

  app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
  });
};

start();
