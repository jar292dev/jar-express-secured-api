import { Router } from 'express';
import noticesRouter from './modules/notices/notices.routes';
import authRouter from './modules/auth/auth.routes';

export const v1Router = Router();

// Rutas de la API
v1Router.use('/auth', authRouter);
v1Router.use('/notices', noticesRouter);
