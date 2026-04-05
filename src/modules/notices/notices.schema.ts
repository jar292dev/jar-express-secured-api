import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants';
import { paginatedFilterSchema } from '../../shared/schemas/common.schema';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const noticeResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number(),
  title: z.string(),
  body: z.string(),
  level: z.enum(['info', 'warning', 'danger', 'success']),
  isActive: z.boolean(),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
});

export const noticeFilterSchema = paginatedFilterSchema.extend({
  title: z
    .string()
    .optional()
    .openapi({ description: 'Título de la noticia', example: 'Título de la noticia' }),
  body: z
    .string()
    .optional()
    .openapi({ description: 'Contenido de la noticia', example: 'Contenido de la noticia' }),
  level: z
    .enum(['info', 'warning', 'danger', 'success'])
    .optional()
    .openapi({ description: 'Nivel de la noticia', example: 'info' }),
  isActive: z
    .boolean()
    .optional()
    .openapi({ description: 'Indica si la noticia está activa', example: true }),
  startsAt: z.coerce
    .date()
    .optional()
    .openapi({ description: 'Fecha de inicio de la noticia', example: '2023-01-01T00:00:00Z' }),
  endsAt: z.coerce
    .date()
    .optional()
    .openapi({ description: 'Fecha de fin de la noticia', example: '2023-12-31T23:59:59Z' }),
});

export const noticeCreateSchema = z.object({
  title: z
    .string(VALIDATION_MESSAGES.REQUIRED('title'))
    .min(1, VALIDATION_MESSAGES.MIN_LENGTH('title', 1)),
  body: z
    .string(VALIDATION_MESSAGES.REQUIRED('body'))
    .min(1, VALIDATION_MESSAGES.MIN_LENGTH('body', 1)),
  level: z.enum(['info', 'warning', 'danger', 'success'], {
    message: VALIDATION_MESSAGES.INVALID_ENUM('level', ['info', 'warning', 'danger', 'success']),
  }),
  isActive: z.boolean().optional().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export const noticeUpdateSchema = z.object({
  title: z.string().min(1, 'El título es requerido').optional(),
  body: z.string().min(1, 'El cuerpo es requerido').optional(),
  level: z.enum(['info', 'warning', 'danger', 'success']).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export type NoticeResponseDTO = z.infer<typeof noticeResponseSchema>;
export type NoticeFilterDTO = z.infer<typeof noticeFilterSchema>;
export type CreateNoticeDTO = z.infer<typeof noticeCreateSchema>;
export type UpdateNoticeDTO = z.infer<typeof noticeUpdateSchema>;
