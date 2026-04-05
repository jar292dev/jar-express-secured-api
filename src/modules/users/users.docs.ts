import { z } from 'zod';
import { registry } from '../../docs/openapi.registry';
import {
  userCreateSchema,
  userFilterSchema,
  userResponseSchema,
  userUpdateMeSchema,
  userUpdateSchema,
} from './users.schema';

const UserSchema = registry.register('User', userResponseSchema);
registry.register('UserCreate', userCreateSchema);
registry.register('UserUpdate', userUpdateSchema);
registry.register('UserUpdateMe', userUpdateMeSchema);
registry.register('UserFilter', userFilterSchema);

const paginatedUsersSchema = z.object({
  data: z.array(UserSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    pages: z.number(),
  }),
});

// GET /users
registry.registerPath({
  method: 'get',
  path: '/users',
  tags: ['Users'],
  security: [{ cookieAuth: [] }],
  request: { query: userFilterSchema },
  responses: {
    200: {
      description: 'Lista paginada de usuarios',
      content: { 'application/json': { schema: paginatedUsersSchema } },
    },
    401: { description: 'No autenticado' },
    403: { description: 'Solo admins' },
  },
});

// GET /users/me
registry.registerPath({
  method: 'get',
  path: '/users/me',
  tags: ['Users'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Perfil del usuario autenticado',
      content: {
        'application/json': {
          schema: z.object({ data: UserSchema }),
        },
      },
    },
    401: { description: 'No autenticado' },
  },
});

// GET /users/:id
registry.registerPath({
  method: 'get',
  path: '/users/{id}',
  tags: ['Users'],
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Usuario encontrado',
      content: { 'application/json': { schema: z.object({ data: UserSchema }) } },
    },
    401: { description: 'No autenticado' },
    403: { description: 'Solo admins' },
    404: { description: 'Usuario no encontrado' },
  },
});

// POST /users
registry.registerPath({
  method: 'post',
  path: '/users',
  tags: ['Users'],
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: userCreateSchema } } },
  },
  responses: {
    201: {
      description: 'Usuario creado',
      content: { 'application/json': { schema: z.object({ data: UserSchema }) } },
    },
    401: { description: 'No autenticado' },
    403: { description: 'Solo admins' },
    409: { description: 'Email ya registrado' },
  },
});

// PUT /users/me
registry.registerPath({
  method: 'put',
  path: '/users/me',
  tags: ['Users'],
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: userUpdateMeSchema } } },
  },
  responses: {
    200: {
      description: 'Perfil actualizado',
      content: { 'application/json': { schema: z.object({ data: UserSchema }) } },
    },
    401: { description: 'No autenticado' },
  },
});

// PUT /users/:id
registry.registerPath({
  method: 'put',
  path: '/users/{id}',
  tags: ['Users'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: userUpdateSchema } } },
  },
  responses: {
    200: {
      description: 'Usuario actualizado',
      content: { 'application/json': { schema: z.object({ data: UserSchema }) } },
    },
    401: { description: 'No autenticado' },
    403: { description: 'Solo admins' },
    404: { description: 'Usuario no encontrado' },
  },
});

// DELETE /users/:id
registry.registerPath({
  method: 'delete',
  path: '/users/{id}',
  tags: ['Users'],
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    204: { description: 'Usuario eliminado' },
    401: { description: 'No autenticado' },
    403: { description: 'Solo admins o intento de auto-eliminación' },
    404: { description: 'Usuario no encontrado' },
  },
});
