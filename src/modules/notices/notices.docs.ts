import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registry } from '../../docs/openapi.registry';
import {
  noticeCreateSchema,
  noticeUpdateSchema,
  noticeFilterSchema,
  noticeResponseSchema,
} from './notices.schema';

extendZodWithOpenApi(z);

// Registra el schema como componente reutilizable
const NoticeSchema = registry.register('Notice', noticeResponseSchema);
registry.register('NoticeFilter', noticeFilterSchema);
registry.register('NoticeCreate', noticeCreateSchema);
registry.register('NoticeUpdate', noticeUpdateSchema);

// GET /notices
registry.registerPath({
  method: 'get',
  path: '/v1/notices',
  tags: ['Notices'],
  request: { query: noticeFilterSchema },
  responses: {
    200: {
      description: 'Lista paginada de avisos',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(NoticeSchema),
            meta: z.object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              pages: z.number(),
            }),
          }),
        },
      },
    },
  },
});

// GET /notices/:id
registry.registerPath({
  method: 'get',
  path: '/v1/notices/{id}',
  tags: ['Notices'],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Aviso encontrado',
      content: { 'application/json': { schema: z.object({ data: NoticeSchema }) } },
    },
    404: { description: 'Aviso no encontrado' },
  },
});

// POST /notices
registry.registerPath({
  method: 'post',
  path: '/v1/notices',
  tags: ['Notices'],
  request: { body: { content: { 'application/json': { schema: noticeCreateSchema } } } },
  responses: {
    201: {
      description: 'Aviso creado',
      content: { 'application/json': { schema: z.object({ data: NoticeSchema }) } },
    },
  },
});

// PUT /notices/:id
registry.registerPath({
  method: 'put',
  path: '/v1/notices/{id}',
  tags: ['Notices'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: noticeUpdateSchema } } },
  },
  responses: {
    200: {
      description: 'Aviso actualizado',
      content: { 'application/json': { schema: z.object({ data: NoticeSchema }) } },
    },
    404: { description: 'Aviso no encontrado' },
  },
});

// DELETE /notices/:id
registry.registerPath({
  method: 'delete',
  path: '/v1/notices/{id}',
  tags: ['Notices'],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    204: { description: 'Aviso eliminado' },
    404: { description: 'Aviso no encontrado' },
  },
});
