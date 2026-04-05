```sql
-- Añadir a la tabla users
ALTER TABLE `users`
  ADD COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'user' AFTER `is_active`;

-- Índice opcional, útil si filtras usuarios por rol
ALTER TABLE `users`
  ADD INDEX `users_role_idx` (`role`);
```

Los valores de rol los controlas en la aplicación vía enum en Zod/Prisma, no con un ENUM de MySQL — así añadir un rol nuevo no requiere una migración de BD:

```prisma
model User {
  // ...
  role  String  @default("user")
}
```

```typescript
// users.schema.ts
const USER_ROLES = ['admin', 'moderator', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const userCreateSchema = z.object({
  // ...
  role: z.enum(USER_ROLES).default('user'),
});
```

Si en el futuro necesitas escalar a roles múltiples, el cambio es una migración de BD y ampliar el schema — la lógica de la API no cambia demasiado.
