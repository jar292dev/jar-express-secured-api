Aquí tienes todo lo que necesitas saber ordenado por pasos, usando **Prisma 7** (la versión actual):

---

**1. Instalación**

```bash
# CLI de Prisma (dev)
npm install prisma --save-dev

# Cliente y adaptador de tu BD (ejemplo con SQLite)
npm install @prisma/client

# Para PostgreSQL en su lugar:
# npm install @prisma/client @prisma/adapter-pg pg
# npm install --save-dev @types/pg
```

---

**2. Inicializar Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

Esto crea un directorio `prisma/` con un `schema.prisma`, un `.env` con el placeholder de la URL, y un `prisma.config.ts`.

---

**3. Configurar la conexión — `.env`**

```env
# SQLite
DATABASE_URL="file:./dev.db"

# PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

---

**4. Definir el schema — `prisma/schema.prisma`**

Aquí defines tus modelos. Prisma genera los tipos TypeScript automáticamente a partir de este archivo:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Notice {
  id        String   @id @default(uuid())
  title     String
  body      String
  level     String   // "info" | "warning" | "danger" | "success"
  isActive  Boolean  @default(true)  // ✅ Prisma mapea Boolean → 0/1 en SQLite automáticamente
  startsAt  DateTime
  endsAt    DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notices") // nombre real de la tabla en BD
}
```

El `@@map` controla el nombre de la tabla. El campo `isActive` en camelCase en el modelo se mapea automáticamente a `is_active` en la BD si configuras `previewFeatures = ["prismaSchemaFolder"]`, o lo puedes mapear explícitamente con `@map("is_active")`.

---

**5. Generar el cliente y crear la BD**

```bash
# Crear y aplicar la migración inicial
npx prisma migrate dev --name init

# Esto hace tres cosas:
# 1. Genera el SQL de la migración
# 2. Aplica la migración a la BD
# 3. Regenera el cliente TypeScript
```

Cada vez que cambies el schema, repites `prisma migrate dev --name descripcion_cambio`.

---

**6. Cliente singleton — `src/database/prisma.client.ts`**

El patrón recomendado es usar `globalThis` para evitar crear múltiples instancias en desarrollo con hot reload:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

No hay pool de conexiones que configurar manualmente — Prisma lo gestiona internamente.

---

**7. Tipos generados — sin `NoticesTable` ni nada manual**

Prisma genera todo automáticamente tras el `migrate dev`:

```typescript
import { Prisma, Notice } from '@prisma/client';

// Tipos disponibles automáticamente:
// Notice              → el objeto completo (equivale a tu Selectable<Table>)
// Prisma.NoticeCreateInput  → para crear (equivale a Insertable<Table>)
// Prisma.NoticeUpdateInput  → para actualizar (equivale a Updateable<Table>)
// Prisma.NoticeWhereInput   → para filtros
```

---

**8. Repositorio — `src/notices/notices.repository.ts`**

Sin `any`, sin mapeo manual, sin `CamelCasePlugin`:

```typescript
import { prisma } from '../database/prisma.client';
import { Notice, Prisma } from '@prisma/client';
import { PaginatedFilter } from '../shared/schemas/paginatedFilter.schema';
import { PaginatedResult } from '../shared/types/api.types';

export class NoticesRepository {
  async findWithFilters(
    businessFilters: Prisma.NoticeWhereInput,
    {
      page = 1,
      pageSize = 20,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    }: Partial<PaginatedFilter> = {},
  ): Promise<PaginatedResult<Notice>> {
    const [total, data] = await prisma.$transaction([
      prisma.notice.count({ where: businessFilters }),
      prisma.notice.findMany({
        where: businessFilters,
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string): Promise<Notice | null> {
    return prisma.notice.findUnique({ where: { id } });
  }

  async create(data: Prisma.NoticeCreateInput): Promise<Notice> {
    return prisma.notice.create({ data });
  }

  async update(id: string, data: Prisma.NoticeUpdateInput): Promise<Notice | null> {
    return prisma.notice.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    await prisma.notice.delete({ where: { id } });
    return true;
  }
}
```

---

**Scripts útiles en `package.json`**

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:reset": "prisma migrate reset"
  }
}
```

La diferencia principal con Kysely es que **no escribes ni un tipo de tabla manualmente** — el schema `.prisma` es la única fuente de verdad y todo lo demás se genera.

---

---

---

---

Buena elección. Te doy la configuración completa adaptada a MariaDB con Prisma 7.

---

**1. Instalación**

```bash
npm install @prisma/client @prisma/adapter-mysql mysql2
npm install --save-dev prisma
```

MariaDB usa el adaptador de MySQL.

---

**2. `.env`**

```env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

---

**3. `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Notice {
  // Campos de la tabla base
  id        String   @id @default(uuid()) @db.Char(36)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  version   Int      @default(1)

  // Campos propios
  title     String
  body      String
  level     NoticeLevel
  isActive  Boolean  @default(true)
  startsAt  DateTime
  endsAt    DateTime

  @@map("notices")
}

enum NoticeLevel {
  info
  warning
  danger
  success
}
```

Prisma no soporta herencia de modelos en el schema, así que la "tabla base" se define documentando los campos que deben repetirse. Más adelante te explico cómo manejarlo.

---

**4. El problema de `version` — optimistic locking**

Si `version` es para control de concurrencia, Prisma tiene soporte nativo:

```prisma
model Notice {
  // ...
  version Int @default(1)

  @@version(version) // ✅ Prisma gestiona el incremento automáticamente
}
```

Sin embargo `@@version` está en preview en Prisma. La alternativa estable es incrementarlo manualmente en el update del repositorio:

```typescript
async update(id: string, data: Prisma.NoticeUpdateInput): Promise<Notice | null> {
  return prisma.notice.update({
    where: { id },
    data: {
      ...data,
      version: { increment: 1 }, // ✅
    },
  });
}
```

---

**5. La tabla base — cómo manejarla en TypeScript**

Como Prisma no permite herencia en el schema, la "tabla base" vive en dos sitios:

En el schema, defines los campos en cada modelo (copy-paste inevitable, pero son pocos):

```prisma
// Se repite en cada modelo
id        String   @id @default(uuid()) @db.Char(36)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
version   Int      @default(1)
```

En TypeScript, defines el tipo base y lo usas para tipar el repositorio:

```typescript
// src/shared/types/base.entity.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}
```

```typescript
// src/shared/repositories/base.repository.ts
import { prisma } from '../database/prisma.client';
import { BaseEntity } from '../types/base.entity';
import { PaginatedFilter } from '../schemas/paginatedFilter.schema';
import { PaginatedResult } from '../types/api.types';

// T = tipo del modelo (Notice, User, etc.)
// W = tipo del where de Prisma (Prisma.NoticeWhereInput, etc.)
// C = tipo del create de Prisma
// U = tipo del update de Prisma
export abstract class BaseRepository<T extends BaseEntity, W, C, U> {
  // Cada repositorio hijo indica su delegate de Prisma
  // (prisma.notice, prisma.user, etc.)
  protected abstract delegate: {
    count: (args: { where?: W }) => Promise<number>;
    findMany: (args: { where?: W; orderBy?: object; skip?: number; take?: number }) => Promise<T[]>;
    findUnique: (args: { where: { id: string } }) => Promise<T | null>;
    create: (args: { data: C }) => Promise<T>;
    update: (args: { where: { id: string }; data: U }) => Promise<T>;
    delete: (args: { where: { id: string } }) => Promise<T>;
  };

  async findWithFilters(
    where: W,
    {
      page = 1,
      pageSize = 20,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    }: Partial<PaginatedFilter> = {},
  ): Promise<PaginatedResult<T>> {
    const [total, data] = await prisma.$transaction([
      this.delegate.count({ where }),
      this.delegate.findMany({
        where,
        orderBy: { [orderBy]: orderDirection },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit: pageSize, pages: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  async create(data: C): Promise<T> {
    return this.delegate.create({ data });
  }

  async update(id: string, data: U): Promise<T> {
    return this.delegate.update({
      where: { id },
      data: { ...(data as object), version: { increment: 1 } } as U,
    });
  }

  async delete(id: string): Promise<boolean> {
    await this.delegate.delete({ where: { id } });
    return true;
  }
}
```

---

**6. Repositorio concreto — limpio y sin boilerplate**

```typescript
// src/notices/notices.repository.ts
import { Notice, Prisma } from '@prisma/client';
import { prisma } from '../shared/database/prisma.client';
import { BaseRepository } from '../shared/repositories/base.repository';

export class NoticesRepository extends BaseRepository
  Notice,
  Prisma.NoticeWhereInput,
  Prisma.NoticeCreateInput,
  Prisma.NoticeUpdateInput
> {
  protected delegate = prisma.notice; // ✅ toda la magia viene de aquí
}
```

Cada nuevo módulo solo necesita estas 5 líneas. Los tipos `WhereInput`, `CreateInput` y `UpdateInput` los genera Prisma automáticamente del schema.

---

**7. Migración inicial**

```bash
npx prisma migrate dev --name init
```

Esto genera el SQL, lo aplica en MariaDB y regenera el cliente TypeScript. A partir de aquí, cada cambio en el schema es otro `migrate dev`.
