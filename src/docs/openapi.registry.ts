import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

// Instancia global — todos los módulos registran aquí sus schemas y paths
export const registry = new OpenAPIRegistry();

// ─── Esquema de seguridad JWT ─────────────────────────────────
// registry.registerComponent('securitySchemes', 'bearerAuth', {
//   type: 'http',
//   scheme: 'bearer',
//   bearerFormat: 'JWT',
//   description: 'Token JWT obtenido en POST /api/v1/auth/login',
// });
