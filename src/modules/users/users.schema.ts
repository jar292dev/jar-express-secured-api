import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const userResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: 'Identificador único del usuario',
    example: '019d5e91-97f7-772b-8dec-b070b0cca800',
  }),
  createdAt: z.date().openapi({
    description: 'Fecha de creación del usuario',
    example: '2026-04-05T18:51:11.798Z',
  }),
  updatedAt: z.date().openapi({
    description: 'Fecha de última actualización del usuario',
    example: '2026-04-05T18:51:11.798Z',
  }),
  version: z.number().openapi({
    description: 'Versión del registro para control de concurrencia optimista',
    example: 1,
  }),
  email: z.string().email().openapi({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  }),
  username: z.string().nullable().openapi({
    description: 'Nombre de usuario único, opcional',
    example: 'juanlopez',
  }),
  firstName: z.string().nullable().openapi({
    description: 'Nombre del usuario',
    example: 'Juan',
  }),
  lastName: z.string().nullable().openapi({
    description: 'Apellido del usuario',
    example: 'López',
  }),
  avatarUrl: z.string().nullable().openapi({
    description: 'URL del avatar del usuario',
    example: 'https://example.com/avatars/juanlopez.jpg',
  }),
  locale: z.string().nullable().openapi({
    description: 'Idioma preferido del usuario',
    example: 'es',
  }),
  role: z.enum(['admin', 'moderator', 'user']).openapi({
    description: 'Rol del usuario en el sistema',
    example: 'user',
  }),
  isActive: z.boolean().openapi({
    description: 'Indica si la cuenta del usuario está activa',
    example: true,
  }),
  isEmailVerified: z.boolean().openapi({
    description: 'Indica si el email del usuario ha sido verificado',
    example: false,
  }),
  emailVerifiedAt: z.date().nullable().openapi({
    description: 'Fecha en la que se verificó el email',
    example: '2026-04-05T18:51:11.798Z',
  }),
  lastLoginAt: z.date().nullable().openapi({
    description: 'Fecha del último inicio de sesión',
    example: '2026-04-05T18:51:11.798Z',
  }),
  failedLoginAttempts: z.number().openapi({
    description: 'Número de intentos de login fallidos consecutivos',
    example: 0,
  }),
  lockedUntil: z.date().nullable().openapi({
    description: 'Fecha hasta la que la cuenta está bloqueada por exceso de intentos fallidos',
    example: null,
  }),
  createdBy: z.string().nullable().openapi({
    description: 'ID del usuario que creó este registro',
    example: '019d5e91-97f7-772b-8dec-b070b0cca800',
  }),
  updatedBy: z.string().nullable().openapi({
    description: 'ID del usuario que realizó la última modificación',
    example: '019d5e91-97f7-772b-8dec-b070b0cca800',
  }),
});

export const userCreateSchema = z.object({
  email: z.string().email().openapi({
    description: 'Email del nuevo usuario',
    example: 'nuevo@example.com',
  }),
  password: z.string().min(8).openapi({
    description: 'Contraseña del usuario, mínimo 8 caracteres',
    example: 'MiPassword123!',
  }),
  firstName: z.string().optional().openapi({
    description: 'Nombre del usuario',
    example: 'Juan',
  }),
  lastName: z.string().optional().openapi({
    description: 'Apellido del usuario',
    example: 'López',
  }),
  role: z.enum(['admin', 'moderator', 'user']).optional().default('user').openapi({
    description: 'Rol asignado al usuario',
    example: 'user',
  }),
  isActive: z.boolean().optional().default(true).openapi({
    description: 'Estado inicial de la cuenta',
    example: true,
  }),
});

export const userUpdateSchema = z.object({
  firstName: z.string().optional().openapi({
    description: 'Nombre del usuario',
    example: 'Juan',
  }),
  lastName: z.string().optional().openapi({
    description: 'Apellido del usuario',
    example: 'López',
  }),
  role: z.enum(['admin', 'moderator', 'user']).optional().openapi({
    description: 'Nuevo rol del usuario',
    example: 'moderator',
  }),
  isActive: z.boolean().optional().openapi({
    description: 'Activar o desactivar la cuenta del usuario',
    example: true,
  }),
});

export const userUpdateMeSchema = z.object({
  firstName: z.string().optional().openapi({
    description: 'Nombre del usuario',
    example: 'Juan',
  }),
  lastName: z.string().optional().openapi({
    description: 'Apellido del usuario',
    example: 'López',
  }),
  avatarUrl: z.string().url().optional().openapi({
    description: 'URL del nuevo avatar',
    example: 'https://example.com/avatars/nuevo.jpg',
  }),
  locale: z.string().optional().openapi({
    description: 'Idioma preferido',
    example: 'en',
  }),
});

export const userFilterSchema = z.object({
  email: z.string().optional().openapi({
    description: 'Filtrar por email (búsqueda parcial)',
    example: 'example.com',
  }),
  role: z.enum(['admin', 'moderator', 'user']).optional().openapi({
    description: 'Filtrar por rol',
    example: 'user',
  }),
  isActive: z.boolean().optional().openapi({
    description: 'Filtrar por estado de la cuenta',
    example: true,
  }),
  page: z.coerce.number().default(1).openapi({
    description: 'Número de página',
    example: 1,
  }),
  pageSize: z.coerce.number().default(20).openapi({
    description: 'Número de elementos por página',
    example: 20,
  }),
  orderBy: z.string().default('createdAt').openapi({
    description: 'Campo por el que ordenar los resultados',
    example: 'createdAt',
  }),
  orderDirection: z.enum(['asc', 'desc']).default('desc').openapi({
    description: 'Dirección de la ordenación',
    example: 'desc',
  }),
});

export type UserResponseDTO = z.infer<typeof userResponseSchema>;
export type UserCreateDTO = z.infer<typeof userCreateSchema>;
export type UserUpdateDTO = z.infer<typeof userUpdateSchema>;
export type UserUpdateMeDTO = z.infer<typeof userUpdateMeSchema>;
export type UserFilterDTO = z.infer<typeof userFilterSchema>;
