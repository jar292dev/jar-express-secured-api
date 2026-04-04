import { z } from 'zod';
import { VALIDATION_MESSAGES } from '../../shared/constants/messages.constants';
import { paginatedFilterSchema } from '../../shared/schemas/common.schema';

export const noticeFilterSchema = paginatedFilterSchema.extend({
  title: z.string().optional(),
  body: z.string().optional(),
  level: z.enum(['info', 'warning', 'danger', 'success']).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
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

export type NoticeFilterDTO = z.infer<typeof noticeFilterSchema>;
export type CreateNoticeDTO = z.infer<typeof noticeCreateSchema>;
export type UpdateNoticeDTO = z.infer<typeof noticeUpdateSchema>;
