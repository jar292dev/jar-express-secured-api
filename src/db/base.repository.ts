import { Kysely, Selectable, Insertable, Updateable, sql } from 'kysely';
import { Database } from './database.types';

export abstract class BaseRepository<
  TableName extends keyof Database & string,
  Table extends Database[TableName],
> {
  constructor(
    protected readonly db: Kysely<Database>,
    protected readonly tableName: TableName,
  ) {}

  async findById(id: string): Promise<Selectable<Table> | null> {
    const row = await (this.db.selectFrom(this.tableName).selectAll() as any)
      .where('id', '=', id)
      .executeTakeFirst();

    return (row ?? null) as Selectable<Table> | null;
  }

  async findAll(): Promise<Selectable<Table>[]> {
    const rows = await this.db.selectFrom(this.tableName).selectAll().execute();

    return rows as Selectable<Table>[];
  }

  async findWithFilters(filters: Partial<Selectable<Table>>): Promise<Selectable<Table>[]> {
    let query = this.db.selectFrom(this.tableName).selectAll() as any;

    for (const [key, value] of Object.entries(filters)) {
      query = query.where(key as any, '=', value);
    }

    const rows = await query.execute();

    return rows as Selectable<Table>[];
  }

  async create(data: Insertable<Table>): Promise<Selectable<Table>> {
    const row = await this.db
      .insertInto(this.tableName)
      .values(data as any)
      .returningAll()
      .executeTakeFirstOrThrow();

    return row as Selectable<Table>;
  }

  async update(id: string, data: Updateable<Table>): Promise<Selectable<Table> | null> {
    const row = ((await this.db.updateTable(this.tableName)) as any)
      .set(data as any)
      .where('id' as any, '=', id)
      .returningAll()
      .executeTakeFirst();

    return (row as Selectable<Table>) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = ((await this.db.deleteFrom(this.tableName)) as any)
      .where('id' as any, '=', id)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  }
}
