import express, { Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { v1Router } from './router';
import { env } from './config/env';
import { errorMiddleware } from './shared/middlewares/error.middleware';
import { mountSwagger } from './docs/openapi';
import { requestContextMiddleware } from './shared/middlewares/request-context.middleware';

// ─── Inicialización de la aplicación ─────────────────────────────────────────────
const app: Application = express();

// ─── Middlewares de seguridad ─────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }),
);

// ─── Middlewares globales ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestContextMiddleware);
app.use(cookieParser());

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
app.use('/api/v1', v1Router);

// ─── Middleware de error ─────────────────────────────────────────────
app.use(errorMiddleware);

// ─── Exportar la aplicación ─────────────────────────────────────────────
export default app;
