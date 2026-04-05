import { Application } from 'express';
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './openapi.registry';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env';

// Importar los docs de cada módulo para que se auto-registren
import '../modules/notices/notices.docs';
import '../modules/auth/auth.docs';
import '../modules/users/users.docs';

function generateSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'JAR Express Base API',
      version: '1.0.0',
      description:
        'API de prueba para demostrar la integración de Zod con OpenAPI. Documentación generada automáticamente a partir de los schemas y rutas definidos en el código.',
    },
    servers: [{ url: `http://${env.HOST}:${env.PORT}/api`, description: 'Development' }],
  });
}

export function mountSwagger(app: Application): void {
  // Solo en development
  if (process.env.NODE_ENV !== 'development') return;

  // Lazy import para no cargar swagger-ui en producción

  const spec = generateSpec();

  app.use(
    '/api/v1/docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: 'Football API Docs',
      swaggerOptions: {
        persistAuthorization: true, // mantiene el JWT entre recargas
        docExpansion: 'list', // endpoints colapsados por defecto
        filter: true, // buscador de endpoints
      },
    }),
  );

  // También disponible como JSON puro para importar en Postman/Insomnia
  app.get('/api/docs.json', (_req, res) => res.json(spec));

  // eslint-disable-next-line no-console
  console.log(`📖 Swagger UI disponible en http://${env.HOST}:${env.PORT}/api/docs`);
}
