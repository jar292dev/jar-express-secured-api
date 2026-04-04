# jar-express-base-api

API REST base construida con **Node.js + Express + TypeScript + Prisma**. Diseñada como plantilla de referencia con arquitectura en capas, validación de esquemas, documentación automática y tests en tres niveles.

---

## Tecnologías

| Categoría     | Tecnología                  |
| ------------- | --------------------------- |
| Runtime       | Node.js                     |
| Framework     | Express 5                   |
| Lenguaje      | TypeScript 5.8              |
| ORM           | Prisma 5 + MySQL            |
| Validación    | Zod 4                       |
| Documentación | zod-to-openapi + Swagger UI |
| Tests         | Vitest + Supertest          |
| Logging       | Morgan                      |

---

## Estructura del proyecto

```
src/
├── app.ts                        # Configuración de Express (middlewares, rutas)
├── router.ts                     # Router raíz con prefijo /api/v1
├── server.ts                     # Bootstrap: conexión BD, arranque y cierre limpio
│
├── config/
│   └── env.ts                    # Variables de entorno validadas con Zod
│
├── database/
│   └── prisma.client.ts          # Singleton de PrismaClient
│
├── docs/
│   ├── openapi.registry.ts       # Registro global de OpenAPI
│   └── openapi.ts                # Generador del documento OpenAPI
│
├── generated/
│   └── prisma/                   # Cliente Prisma generado (no editar)
│
├── modules/
│   └── notices/                  # Módulo de ejemplo
│       ├── notices.controller.ts
│       ├── notices.docs.ts       # Registro OpenAPI del módulo
│       ├── notices.repository.ts
│       ├── notices.routes.ts
│       ├── notices.schema.ts     # Schemas Zod (validación + tipos)
│       ├── notices.service.ts
│       └── tests/
│           ├── notices.e2e.test.ts
│           ├── notices.repository.test.ts
│           └── notices.service.test.ts
│
├── shared/
│   ├── container.ts              # Inyección de dependencias manual
│   ├── constants/
│   │   ├── http.constants.ts     # Códigos HTTP
│   │   └── messages.constants.ts
│   ├── errors/
│   │   └── app.error.ts          # Errores de dominio tipados
│   ├── middlewares/
│   │   ├── error.middleware.ts   # Manejador global de errores
│   │   └── validate.middleware.ts # Validación con Zod (body, params, query)
│   ├── repositories/
│   │   └── base.repository.ts    # Repositorio genérico con CRUD + paginación
│   ├── schemas/
│   │   └── common.schema.ts      # Schemas compartidos (UUID, paginación)
│   └── types/
│       ├── api.types.ts          # Tipos de respuesta API
│       ├── base.entity.ts        # Tipo base de entidades
│       └── express.d.ts          # Extensión de tipos de Express
│
└── tests/
    └── setup.ts                  # Setup global de Vitest
```

---

## Arquitectura

La API sigue una **arquitectura en capas** donde cada capa tiene una responsabilidad única:

```
Request
   │
   ▼
Middleware (validación de schema Zod)
   │
   ▼
Controller  ──→  transforma req/res, delega al service
   │
   ▼
Service     ──→  lógica de negocio, orquesta repositorios
   │
   ▼
Repository  ──→  acceso a datos via Prisma
   │
   ▼
Base de datos (MySQL)
```

### Principios aplicados

- **Inversión de dependencias**: los controllers y services reciben sus dependencias por constructor, facilitando el testing con mocks.
- **Repositorio base genérico**: `BaseRepository<T, W, C, U>` implementa CRUD y paginación; los repositorios concretos solo definen su `delegate` de Prisma.
- **Container manual**: `shared/container.ts` centraliza la instanciación de repositorios. No hay framework de DI, solo un objeto literal importado donde se necesita.
- **Errores de dominio**: errores tipados (`NotFoundError`, `ConflictError`, `BadRequestError`) que el middleware global transforma en respuestas HTTP consistentes.

---

## Añadir un nuevo módulo

1. Crea la carpeta `src/modules/{nombre}/`
2. Añade los archivos siguiendo la estructura de `notices`:
   - `{nombre}.schema.ts` — schemas Zod con `createSchema`, `updateSchema`, `filterSchema`
   - `{nombre}.repository.ts` — extiende `BaseRepository`
   - `{nombre}.service.ts` — lógica de negocio
   - `{nombre}.controller.ts` — métodos de Express
   - `{nombre}.routes.ts` — router con middlewares de validación
   - `{nombre}.docs.ts` — registro OpenAPI (se carga automáticamente)
3. Registra el repositorio en `shared/container.ts`
4. Registra el router en `src/router.ts`
5. Añade el modelo en `prisma/schema.prisma` y ejecuta `npx prisma generate`

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

```env
NODE_ENV=development
HOST=localhost
PORT=3000

DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=mydb
```

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo con hot reload
npm run dev

# Compilar
npm run build

# Producción
npm start

# Generar cliente Prisma tras cambios en schema
npx prisma generate

# Sincronizar schema con la BD (desarrollo)
npx prisma db push

# Migraciones con historial
npx prisma migrate dev

# Tests
npm test               # modo watch
npm run test:run       # ejecución única
npm run test:coverage  # con cobertura
```

---

## API Reference

La documentación interactiva está disponible en modo desarrollo en:

```
http://localhost:3000/docs
```

Los esquemas OpenAPI se generan automáticamente a partir de los archivos `*.docs.ts` de cada módulo — no hay que mantener YAML ni JSON manualmente.

### Endpoints de Notices

| Método   | Ruta                  | Descripción                |
| -------- | --------------------- | -------------------------- |
| `GET`    | `/api/v1/notices`     | Lista paginada con filtros |
| `GET`    | `/api/v1/notices/:id` | Obtener por ID             |
| `POST`   | `/api/v1/notices`     | Crear                      |
| `PUT`    | `/api/v1/notices/:id` | Actualizar                 |
| `DELETE` | `/api/v1/notices/:id` | Eliminar                   |

#### Parámetros de paginación (query)

| Parámetro        | Tipo            | Default     | Descripción          |
| ---------------- | --------------- | ----------- | -------------------- |
| `page`           | number          | 1           | Página actual        |
| `pageSize`       | number          | 20          | Elementos por página |
| `orderBy`        | string          | `createdAt` | Campo de ordenación  |
| `orderDirection` | `asc` \| `desc` | `desc`      | Dirección            |

#### Formato de respuesta

```json
// Respuesta paginada
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}

// Respuesta single
{
  "data": { ... }
}

// Error
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Aviso no encontrado",
    "details": {}
  }
}
```

---

## Tests

La estrategia de tests tiene tres niveles:

| Nivel       | Fichero                | Descripción                                |
| ----------- | ---------------------- | ------------------------------------------ |
| Unit        | `*.service.test.ts`    | Lógica de negocio con repositorio mockeado |
| Integration | `*.repository.test.ts` | Queries reales contra BD de desarrollo     |
| E2E         | `*.e2e.test.ts`        | Peticiones HTTP completas con Supertest    |

Los tests de integración y E2E requieren la base de datos levantada. Para aislar entornos, crea un `.env.test` con una `DATABASE_URL` separada.

---

## Decisiones de diseño

**¿Por qué Prisma y no un query builder?**
Prisma genera tipos TypeScript a partir del schema, eliminando una categoría entera de bugs en tiempo de compilación. Para una API base de referencia, la seguridad de tipos tiene más valor que la flexibilidad raw de SQL.

**¿Por qué DI manual y no un framework como TSyringe?**
Para una API de este tamaño, un objeto literal en `container.ts` es suficiente, explícito y sin magia. Facilita el onboarding y el debugging. Si el proyecto crece, migrar a TSyringe o InversifyJS es trivial.

**¿Por qué `*.docs.ts` separados y no inline en las rutas?**
Mantener la documentación OpenAPI separada evita contaminar el código de producción con metadatos de documentación. Los archivos se auto-descubren en arranque mediante glob, por lo que añadir un módulo nuevo no requiere tocar ningún fichero central.
