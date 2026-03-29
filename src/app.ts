import express, { Application } from 'express';
import morgan from 'morgan';
import { router } from './router';
import { env } from './config/env';


// ─── Creación de la aplicación Express ─────────────────────────────
const app: Application = express();

// ─── Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));


// ─── Logger ───────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));


// ─── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});


// ─── Documentación (solo development) ─────────────────────────


// ─── Rutas de la API ──────────────────────────────────────────
app.use('/api', router);


// ─── Middleware de manejo de errores (siempre al final) ─────────


export default app;
// ──── Fin del archivo ─────────────────────────────────────────────