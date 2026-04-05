import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const loginSchema = z.object({
  email: z.string().email().openapi({ description: 'Email del usuario', example: 'email-here' }),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email().openapi({ description: 'Email del usuario', example: 'email-here' }),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  firstName: z.string().openapi({ description: 'Nombre del usuario', example: 'John' }).optional(),
  lastName: z.string().openapi({ description: 'Apellido del usuario', example: 'Doe' }).optional(),
});

export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
