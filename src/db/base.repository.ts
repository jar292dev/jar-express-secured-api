import {
  Kysely,
  Selectable,
  Insertable,
  Updateable,
  SelectQueryBuilder,
  ReferenceExpression,
  OrderByExpression,
} from 'kysely';
import { Database } from './database.types';
import { ApiMeta } from '../shared/types/api.types';
import { PaginatedFilter } from '../shared/schemas/common.schema';

export interface PaginatedResult<T> {
  data: T[];
  meta: ApiMeta;
}

// Tipo auxiliar para el SelectQueryBuilder de una tabla concreta
type TableQueryBuilder<TableName extends keyof Database & string> = SelectQueryBuilder<
  Database,
  TableName,
  object
>;

export abstract class BaseRepository<
  TableName extends keyof Database & string,
  Table extends Database[TableName],
> {
  constructor(
    protected readonly db: Kysely<Database>,
    protected readonly tableName: TableName,
  ) {}

  // Builder base reutilizable y tipado
  private baseQuery(): TableQueryBuilder<TableName> {
    return this.db.selectFrom(this.tableName) as TableQueryBuilder<TableName>;
  }

  async findById(id: string): Promise<Selectable<Table> | null> {
    const row = await this.baseQuery()
      .selectAll()
      .where('id' as ReferenceExpression<Database, TableName>, '=', id)
      .executeTakeFirst();

    return (row as Selectable<Table>) ?? null;
  }

  async findAll(): Promise<Selectable<Table>[]> {
    const rows = (await this.baseQuery().selectAll().execute()) as unknown as Selectable<Table>[];
    return rows as Selectable<Table>[];
  }

  async findWithFilters(
    businessFilters: Partial<Selectable<Table>>,
    {
      page = 1,
      pageSize = 20,
      orderBy = 'created_at',
      orderDirection = 'desc',
    }: Partial<PaginatedFilter> = {},
  ): Promise<PaginatedResult<Selectable<Table>>> {
    // Construir query base con filtros
    let query = this.baseQuery() as TableQueryBuilder<TableName>;

    for (const [key, value] of Object.entries(businessFilters)) {
      if (value !== undefined) {
        query = query.where(key as ReferenceExpression<Database, TableName>, '=', value);
      }
    }

    // Count sin paginación
    const countResult = await query
      .select(this.db.fn.countAll().as('total'))
      .executeTakeFirstOrThrow();

    const total = Number(countResult.total);

    // Datos con ordenación y paginación
    const offset = (page - 1) * pageSize;
    const rows = await query
      .selectAll()
      .orderBy(orderBy as OrderByExpression<Database, TableName, object>, orderDirection)
      .offset(offset)
      .limit(pageSize)
      .execute();

    return {
      data: rows as unknown as Selectable<Table>[],
      meta: {
        total,
        page,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    };
  }

  async create(data: Insertable<Table>): Promise<Selectable<Table>> {
    const row = await this.db
      .insertInto(this.tableName)
      .values(data as Insertable<Database[TableName]>)
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as Selectable<Table>;
  }

  async update(id: string, data: Updateable<Table>): Promise<Selectable<Table> | null> {
    // Extraemos campos automáticos para evitar intentar actualizarlos manualmente
    const { id: _, created_at: __, updated_at: ___, version: ____, ...updateData } = data as any;

    // El error ocurre porque updateTable(generic) devuelve una unión de builders.
    // Casteamos el builder a 'any' para permitir la llamada a .set() sin conflictos de firmas.
    const query = this.db.updateTable(this.tableName) as any;

    const row = await query
      .set(updateData)
      .where('id' as any, '=', id)
      .returningAll()
      .executeTakeFirst();

    return (row as Selectable<Table>) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    // El builder de deleteFrom genera el mismo error de unión de firmas que updateTable.
    // Casteamos a 'any' para poder invocar .where() de forma genérica.
    const query = this.db.deleteFrom(this.tableName) as any;

    const result = await query.where('id', '=', id).executeTakeFirst();

    return result.numDeletedRows > 0n;
  }
}
