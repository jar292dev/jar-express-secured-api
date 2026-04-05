La auditoría en una API REST tiene dos niveles distintos:

---

## Nivel 1 — Auditoría de campos en la entidad (lo que ya tienes)

Es lo más básico y ya lo tienes implementado:

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
version   Int      @default(1)
```

Esto responde a **cuándo** se creó/modificó, pero no **quién**.

---

## Nivel 2 — Auditoría de actor (quién hizo qué)

Añades campos de usuario a cada entidad:

```prisma
model Notice {
  // ...campos actuales...
  createdBy String? @map("created_by")  // id del usuario
  updatedBy String? @map("updated_by")
}
```

El service recibe el `userId` del contexto (normalmente del token JWT en el futuro) y lo pasa al repositorio:

```typescript
async createNotice(data: CreateNoticeDTO, userId: string): Promise<Notice> {
  return this.repository.create({ ...data, createdBy: userId });
}
```

---

## Nivel 3 — Tabla de auditoría separada (log de cambios)

En vez de solo guardar el último actor, guardas **todo el historial** de cambios en una tabla aparte:

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  createdAt  DateTime @default(now()) @map("created_at")
  entity     String   // "Notice", "User", etc.
  entityId   String   @map("entity_id")
  action     String   // "CREATE", "UPDATE", "DELETE"
  actorId    String?  @map("actor_id")
  before     Json?    // estado anterior
  after      Json?    // estado nuevo

  @@map("audit_logs")
}
```

Esto responde a: quién cambió qué, cuándo, y cuál era el valor anterior.

---

## Cómo se implementa sin usuarios todavía

Sin tabla de usuarios puedes preparar la arquitectura igualmente usando un **contexto de request**:

```typescript
// shared/types/request-context.ts
export interface RequestContext {
  actorId: string | null; // null hasta que haya auth
  ip: string;
}
```

Lo inyectas como middleware y lo pasas por capas. Cuando llegue la autenticación, solo cambias el middleware que rellena el `actorId` — el resto de la arquitectura no cambia.

---

## ¿Qué nivel te interesa implementar?

---

---

---

Perfecto. Vamos paso a paso.

---

## 1. Schema de Prisma

```prisma
model Notice {
  id        String      @id @default(uuid()) @db.Char(36)
  createdAt DateTime    @default(now()) @map("created_at")
  updatedAt DateTime    @updatedAt @map("updated_at")
  version   Int         @default(1)
  title     String
  body      String
  level     NoticeLevel
  isActive  Boolean     @default(true) @map("is_active")
  startsAt  DateTime?   @map("starts_at")
  endsAt    DateTime?   @map("ends_at")

  # Nivel 2
  createdBy String?     @map("created_by")
  updatedBy String?     @map("updated_by")

  @@map("notices")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Char(36)
  createdAt DateTime @default(now()) @map("created_at")
  entity    String
  entityId  String   @map("entity_id")
  action    String
  actorId   String?  @map("actor_id")
  before    Json?
  after     Json?

  @@map("audit_logs")
  @@index([entity, entityId])
  @@index([actorId])
}
```

---

## 2. Contexto de request

**`src/shared/types/request-context.ts`**

```typescript
export interface RequestContext {
  actorId: string | null;
}
```

**`src/shared/middlewares/request-context.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';

// Cuando añadas auth, aquí extraerás el userId del JWT
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.context = {
    actorId: null, // req.user?.id cuando haya auth
  };
  next();
}
```

**`src/shared/types/express.d.ts`** — añade al existente:

```typescript
import { RequestContext } from './request-context';

declare global {
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
      context: RequestContext; // ← añadir esto
    }
  }
}
```

Registra el middleware en `app.ts` antes de los routers:

```typescript
import { requestContextMiddleware } from './shared/middlewares/request-context.middleware';

app.use(requestContextMiddleware);
```

---

## 3. AuditLog repository

**`src/shared/repositories/audit.repository.ts`**

```typescript
import { prisma } from '../../database/prisma.client';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

interface CreateAuditLogParams {
  entity: string;
  entityId: string;
  action: AuditAction;
  actorId: string | null;
  before?: object | null;
  after?: object | null;
}

export class AuditRepository {
  async log(params: CreateAuditLogParams): Promise<void> {
    await prisma.auditLog.create({
      data: {
        entity: params.entity,
        entityId: params.entityId,
        action: params.action,
        actorId: params.actorId,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
      },
    });
  }
}
```

---

## 4. Base service con auditoría

Lo más limpio es mover la lógica de auditoría al service base para no repetirla en cada módulo:

**`src/shared/services/base.service.ts`**

```typescript
import { AuditRepository } from '../repositories/audit.repository';
import { BaseRepository } from '../repositories/base.repository';
import { BaseEntity } from '../types/base.entity';
import { RequestContext } from '../types/request-context';
import { NotFoundError } from '../errors/app.error';
import { PaginatedFilter } from '../schemas/common.schema';
import { PaginatedResult } from '../types/api.types';

export abstract class BaseService<T extends BaseEntity, W, C extends object, U extends object> {
  protected abstract entityName: string;

  constructor(
    protected repository: BaseRepository<
      T,
      W,
      C & { createdBy?: string | null },
      U & { updatedBy?: string | null }
    >,
    protected auditRepository: AuditRepository,
  ) {}

  async findById(id: string): Promise<T> {
    const entity = await this.repository.findById(id);
    if (!entity) throw new NotFoundError(`${this.entityName} no encontrado`, id);
    return entity;
  }

  async findAll(where: W, pagination: Partial<PaginatedFilter>): Promise<PaginatedResult<T>> {
    return this.repository.findWithFilters(where, pagination);
  }

  async create(data: C, context: RequestContext): Promise<T> {
    const created = await this.repository.create({
      ...data,
      createdBy: context.actorId,
    } as C & { createdBy?: string | null });

    await this.auditRepository.log({
      entity: this.entityName,
      entityId: created.id,
      action: 'CREATE',
      actorId: context.actorId,
      after: created as object,
    });

    return created;
  }

  async update(id: string, data: U, context: RequestContext): Promise<T> {
    const before = await this.findById(id);

    const updated = await this.repository.update(id, {
      ...data,
      updatedBy: context.actorId,
    } as U & { updatedBy?: string | null });

    await this.auditRepository.log({
      entity: this.entityName,
      entityId: id,
      action: 'UPDATE',
      actorId: context.actorId,
      before: before as object,
      after: updated as object,
    });

    return updated!;
  }

  async delete(id: string, context: RequestContext): Promise<void> {
    const before = await this.findById(id);

    await this.repository.delete(id);

    await this.auditRepository.log({
      entity: this.entityName,
      entityId: id,
      action: 'DELETE',
      actorId: context.actorId,
      before: before as object,
    });
  }
}
```

---

## 5. NoticesService simplificado

Ahora `NoticesService` extiende `BaseService` y solo añade su lógica específica:

```typescript
import { Notice, Prisma } from '../../generated/prisma';
import { ConflictError } from '../../shared/errors/app.error';
import { AuditRepository } from '../../shared/repositories/audit.repository';
import { BaseService } from '../../shared/services/base.service';
import { RequestContext } from '../../shared/types/request-context';
import { PaginatedFilter } from '../../shared/schemas/common.schema';
import { PaginatedResult } from '../../shared/types/api.types';
import { NoticesRepository } from './notices.repository';
import { CreateNoticeDTO, NoticeFilterDTO, UpdateNoticeDTO } from './notices.schema';

export class NoticesService extends BaseService
  Notice,
  Prisma.NoticeWhereInput,
  CreateNoticeDTO,
  UpdateNoticeDTO
> {
  protected entityName = 'Notice';

  constructor(
    protected repository: NoticesRepository,
    auditRepository: AuditRepository,
  ) {
    super(repository, auditRepository);
  }

  async findNoticeById(id: string): Promise<Notice> {
    return this.findById(id);
  }

  async findAll(
    filters: Partial<NoticeFilterDTO>,
    pagination: Partial<PaginatedFilter>,
  ): Promise<PaginatedResult<Notice>> {
    return super.findAll(filters as Prisma.NoticeWhereInput, pagination);
  }

  async createNotice(data: CreateNoticeDTO, context: RequestContext): Promise<Notice> {
    const existing = await this.repository.findWithFilters({ title: data.title });
    if (existing.data.length > 0) throw new ConflictError('Notice', 'title');
    return super.create(data, context);
  }

  async updateNotice(id: string, data: UpdateNoticeDTO, context: RequestContext): Promise<Notice> {
    return super.update(id, data, context);
  }

  async deleteNotice(id: string, context: RequestContext): Promise<void> {
    return super.delete(id, context);
  }
}
```

---

## 6. Controller — pasa el contexto

```typescript
createNotice = async (
  req: Request,
  res: Response<ApiResponse<Notice>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto = req.validatedBody as CreateNoticeDTO;
    const notice = await this.noticesService.createNotice(dto, req.context);
    res.status(HTTP_STATUS.CREATED).json(ApiResponse.success(notice));
  } catch (err) {
    next(err);
  }
};

updateNotice = async (
  req: Request<UUID>,
  res: Response<ApiResponse<Notice>>,
  next: NextFunction,
): Promise<void> => {
  try {
    const dto = req.validatedBody as UpdateNoticeDTO;
    const notice = await this.noticesService.updateNotice(req.params.id, dto, req.context);
    res.status(HTTP_STATUS.OK).json(ApiResponse.success(notice));
  } catch (err) {
    next(err);
  }
};

deleteNotice = async (req: Request<UUID>, res: Response, next: NextFunction): Promise<void> => {
  try {
    await this.noticesService.deleteNotice(req.params.id, req.context);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
};
```

---

## 7. Container — añade AuditRepository

```typescript
import { AuditRepository } from './shared/repositories/audit.repository';
import { NoticesRepository } from './modules/notices/notices.repository';
import { NoticesService } from './modules/notices/notices.service';

const auditRepository = new AuditRepository();

export const container = {
  auditRepository,
  noticesRepository: new NoticesRepository(),
  noticesService: new NoticesService(new NoticesRepository(), auditRepository),
};
```

---

## Resumen del flujo

```
Request → Middleware (rellena req.context)
       → Controller (pasa req.context al service)
       → BaseService.create/update/delete
             → Repository (escribe la entidad con createdBy/updatedBy)
             → AuditRepository (escribe el log con before/after)
```

Cuando llegue la autenticación, **solo tienes que cambiar una línea** en `request-context.middleware.ts`:

```typescript
actorId: req.user?.id ?? null;
```

El resto de la arquitectura no cambia.
