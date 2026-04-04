import express, { Application } from 'express';
import morgan from 'morgan';
import { router } from './router';
import { env } from './config/env';
import { errorMiddleware } from './shared/middlewares/error.middleware';
import { mountSwagger } from './docs/openapi';
// ─── Inicialización de la aplicación ─────────────────────────────────────────────
const app: Application = express();

// ─── Middlewares globales ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logger ─────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rutas de la API ─────────────────────────────────────────────

// Ruta de salud para monitoreo
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Documentación Swagger (solo en desarrollo)
mountSwagger(app);

// Resto de rutas
app.use('/api', router);

// ─── Middleware de error ─────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Exportar la aplicación ─────────────────────────────────────────────
export default app;
