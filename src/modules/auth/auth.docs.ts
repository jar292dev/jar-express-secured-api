import { z } from 'zod';
import { registry } from '../../docs/openapi.registry';
import { loginSchema, registerSchema } from './auth.schema';

// Registra el schema como componente reutilizable
registry.register('AuthRegister', registerSchema);
registry.register('AuthLogin', loginSchema);
registry.register('AuthRefresh', z.object({ refresh_token: z.string().uuid() }));

// POST /auth/register
registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: registerSchema } } },
  },
  responses: {
    201: {
      description: 'Usuario registrado correctamente',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({ message: z.string() }),
          }),
        },
      },
    },
    409: { description: 'Email ya registrado' },
  },
});

// POST /auth/login
registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: 'Login correcto — tokens seteados en cookies httpOnly',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({ message: z.string() }),
          }),
        },
      },
    },
    401: { description: 'Credenciales inválidas' },
    403: { description: 'Cuenta bloqueada o desactivada' },
  },
});

// POST /auth/refresh
registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  responses: {
    200: {
      description: 'Token renovado — nuevas cookies seteadas',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({ message: z.string() }),
          }),
        },
      },
    },
    401: { description: 'Refresh token inválido o expirado' },
  },
});

// POST /auth/logout
registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  security: [{ cookieAuth: [] }],
  responses: {
    204: { description: 'Logout correcto — cookies eliminadas' },
    401: { description: 'No autenticado' },
  },
});
