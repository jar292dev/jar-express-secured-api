import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number(),
  email: z.string().email(),
  username: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  locale: z.string().nullable(),
  role: z.enum(['admin', 'moderator', 'user']),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
  lastLoginAt: z.date().nullable(),
  failedLoginAttempts: z.number(),
  lockedUntil: z.date().nullable(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
});

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'moderator', 'user']).default('user'),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
  isActive: z.boolean().optional(),
});

export const userUpdateMeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.string().optional(),
});

export const userFilterSchema = z.object({
  email: z.string().optional(),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
  orderBy: z.string().default('createdAt'),
  orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

export type UserResponseDTO = z.infer<typeof userResponseSchema>;
export type UserCreateDTO = z.infer<typeof userCreateSchema>;
export type UserUpdateDTO = z.infer<typeof userUpdateSchema>;
export type UserUpdateMeDTO = z.infer<typeof userUpdateMeSchema>;
export type UserFilterDTO = z.infer<typeof userFilterSchema>;
