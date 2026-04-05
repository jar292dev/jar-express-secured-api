import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants';
import { paginatedFilterSchema } from '../../shared/schemas/common.schema';

extendZodWithOpenApi(z);

export const noticeResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Identificador único del aviso',
    example: '019d5e91-97f7-772b-8dec-b070b0cca800',
  }),
  createdAt: z.date().openapi({
    description: 'Fecha de creación del aviso',
    example: '2026-04-05T18:51:11.798Z',
  }),
  updatedAt: z.date().openapi({
    description: 'Fecha de última actualización del aviso',
    example: '2026-04-05T18:51:11.798Z',
  }),
  version: z.number().openapi({
    description: 'Versión del registro para control de concurrencia optimista',
    example: 1,
  }),
  title: z.string().openapi({
    description: 'Título del aviso',
    example: 'Mantenimiento programado',
  }),
  body: z.string().openapi({
    description: 'Contenido del aviso',
    example: 'El sistema estará en mantenimiento el próximo domingo de 02:00 a 04:00.',
  }),
  level: z.enum(['info', 'warning', 'danger', 'success']).openapi({
    description: 'Nivel de importancia del aviso',
    example: 'warning',
  }),
  isActive: z.boolean().openapi({
    description: 'Indica si el aviso está activo y visible',
    example: true,
  }),
  startsAt: z.date().nullable().openapi({
    description: 'Fecha de inicio de visibilidad del aviso',
    example: '2026-04-05T00:00:00.000Z',
  }),
  endsAt: z.date().nullable().openapi({
    description: 'Fecha de fin de visibilidad del aviso',
    example: '2026-04-12T23:59:59.000Z',
  }),
  createdBy: z.string().nullable().openapi({
    description: 'ID del usuario que creó el aviso',
    example: '019d5e91-97f7-772b-8dec-b070b0cca800',
  }),
  updatedBy: z.string().nullable().openapi({
    description: 'ID del usuario que realizó la última modificación',
    example: '019d5e91-97f7-772b-8dec-b070b0cca800',
  }),
});

export const noticeFilterSchema = paginatedFilterSchema.extend({
  title: z.string().optional().openapi({
    description: 'Filtrar por título del aviso (búsqueda parcial)',
    example: 'mantenimiento',
  }),
  body: z.string().optional().openapi({
    description: 'Filtrar por contenido del aviso (búsqueda parcial)',
    example: 'domingo',
  }),
  level: z.enum(['info', 'warning', 'danger', 'success']).optional().openapi({
    description: 'Filtrar por nivel de importancia',
    example: 'warning',
  }),
  isActive: z.boolean().optional().openapi({
    description: 'Filtrar por estado de visibilidad',
    example: true,
  }),
  startsAt: z.coerce.date().optional().openapi({
    description: 'Filtrar avisos que empiecen a partir de esta fecha',
    example: '2026-04-01T00:00:00.000Z',
  }),
  endsAt: z.coerce.date().optional().openapi({
    description: 'Filtrar avisos que terminen antes de esta fecha',
    example: '2026-04-30T23:59:59.000Z',
  }),
});

export const noticeCreateSchema = z.object({
  title: z
    .string(VALIDATION_MESSAGES.REQUIRED('title'))
    .min(1, VALIDATION_MESSAGES.MIN_LENGTH('title', 1))
    .openapi({
      description: 'Título del aviso',
      example: 'Mantenimiento programado',
    }),
  body: z
    .string(VALIDATION_MESSAGES.REQUIRED('body'))
    .min(1, VALIDATION_MESSAGES.MIN_LENGTH('body', 1))
    .openapi({
      description: 'Contenido del aviso',
      example: 'El sistema estará en mantenimiento el próximo domingo de 02:00 a 04:00.',
    }),
  level: z
    .enum(['info', 'warning', 'danger', 'success'], {
      message: VALIDATION_MESSAGES.INVALID_ENUM('level', ['info', 'warning', 'danger', 'success']),
    })
    .openapi({
      description: 'Nivel de importancia del aviso',
      example: 'warning',
    }),
  isActive: z.boolean().optional().default(true).openapi({
    description: 'Indica si el aviso estará activo al crearse',
    example: true,
  }),
  startsAt: z.coerce.date().optional().openapi({
    description: 'Fecha de inicio de visibilidad del aviso',
    example: '2026-04-05T00:00:00.000Z',
  }),
  endsAt: z.coerce.date().optional().openapi({
    description: 'Fecha de fin de visibilidad del aviso',
    example: '2026-04-12T23:59:59.000Z',
  }),
});

export const noticeUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido').optional().openapi({
    description: 'Nuevo título del aviso',
    example: 'Mantenimiento programado actualizado',
  }),
  body: z.string().min(1, 'El cuerpo es requerido').optional().openapi({
    description: 'Nuevo contenido del aviso',
    example: 'El mantenimiento ha sido reprogramado para el lunes de 03:00 a 05:00.',
  }),
  level: z.enum(['info', 'warning', 'danger', 'success']).optional().openapi({
    description: 'Nuevo nivel de importancia del aviso',
    example: 'danger',
  }),
  isActive: z.boolean().optional().openapi({
    description: 'Activar o desactivar el aviso',
    example: false,
  }),
  startsAt: z.coerce.date().optional().openapi({
    description: 'Nueva fecha de inicio de visibilidad',
    example: '2026-04-06T00:00:00.000Z',
  }),
  endsAt: z.coerce.date().optional().openapi({
    description: 'Nueva fecha de fin de visibilidad',
    example: '2026-04-13T23:59:59.000Z',
  }),
});

export type NoticeResponseDTO = z.infer<typeof noticeResponseSchema>;
export type NoticeFilterDTO = z.infer<typeof noticeFilterSchema>;
export type CreateNoticeDTO = z.infer<typeof noticeCreateSchema>;
export type UpdateNoticeDTO = z.infer<typeof noticeUpdateSchema>;
