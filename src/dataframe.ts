import { ColumnarStorage } from "./storage";
import type { Storage } from "./storage";

export type DeriveResult<
  T extends Record<string, unknown>,
  D extends Record<string, (row: T) => unknown>,
> = Omit<T, keyof D> & { [K in keyof D]: ReturnType<D[K]> };

export type RenameResult<
  T extends Record<string, unknown>,
  M extends Partial<Record<keyof T & string, string>>,
> = Omit<T, keyof M> & { [K in keyof M as NonNullable<M[K]>]: T[K & keyof T] };

export type AggregateResult<
  T extends Record<string, unknown>,
  K extends keyof T,
  A extends Record<string, (rows: T[]) => unknown>,
> = Pick<T, K> & { [AK in keyof A]: ReturnType<A[AK]> };

export class GroupedFrame<
  T extends Record<string, unknown>,
  K extends keyof T,
> {
  constructor(
    private readonly df: DataFrame<T>,
    private readonly key: K,
  ) {}

  aggregate<A extends Record<string, (rows: T[]) => unknown>>(
    aggregations: A,
  ): DataFrame<AggregateResult<T, K, A>> {
    type Result = AggregateResult<T, K, A>;

    const rows = this.df.toRows();
    const groups = new Map<T[K], T[]>();

    for (const row of rows) {
      const keyVal = row[this.key];
      if (!groups.has(keyVal)) groups.set(keyVal, []);
      groups.get(keyVal)!.push(row);
    }

    const resultRows: Result[] = [];
    for (const [keyVal, groupRows] of groups) {
      const resultRow = { [this.key as string]: keyVal } as unknown as Result;
      for (const aggKey of Object.keys(aggregations)) {
        (resultRow as Record<string, unknown>)[aggKey] =
          aggregations[aggKey]!(groupRows);
      }
      resultRows.push(resultRow);
    }

    return fromRows(resultRows);
  }
}

export class DataFrame<T extends Record<string, unknown>> {
  private constructor(
    private readonly storage: Storage<T>,
    private readonly bitmask: boolean[],
    private readonly sortIndex: number[],
  ) {}

  static _create<U extends Record<string, unknown>>(
    storage: Storage<U>,
    bitmask: boolean[],
    sortIndex: number[],
  ): DataFrame<U> {
    return new DataFrame(storage, bitmask, sortIndex);
  }

  private activeIndices(): number[] {
    return this.sortIndex.filter((i) => this.bitmask[i]);
  }

  private rowAt(i: number): T {
    const row: Record<string, unknown> = {};
    for (const col of this.storage.columnNames()) {
      row[col as string] = this.storage.getColumn(col)[i];
    }
    return row as T;
  }

  toRows(): T[] {
    return this.activeIndices().map((i) => this.rowAt(i));
  }

  toColumns(): { [K in keyof T]: T[K][] } {
    const indices = this.activeIndices();
    const result = {} as { [K in keyof T]: T[K][] };
    for (const col of this.storage.columnNames()) {
      const colData = this.storage.getColumn(col);
      result[col] = indices.map((i) => colData[i]!);
    }
    return result;
  }

  filter(fn: (row: T) => boolean): DataFrame<T> {
    const newBitmask = this.bitmask.map((active, i) =>
      active ? fn(this.rowAt(i)) : false,
    );
    return new DataFrame(this.storage, newBitmask, [...this.sortIndex]);
  }

  derive<D extends Record<string, (row: T) => unknown>>(
    derivations: D,
  ): DataFrame<DeriveResult<T, D>> {
    type Result = DeriveResult<T, D>;
    const n = this.storage.size();
    const newCols: Record<string, unknown[]> = {};

    for (const col of this.storage.columnNames()) {
      newCols[col as string] = this.storage.getColumn(col) as unknown[];
    }

    for (const key of Object.keys(derivations)) {
      const fn = derivations[key]!;
      newCols[key] = Array.from({ length: n }, (_, i) => fn(this.rowAt(i)));
    }

    return new DataFrame<Result>(
      ColumnarStorage.fromUnsafe<Result>(newCols),
      [...this.bitmask],
      [...this.sortIndex],
    );
  }

  select<K extends keyof T>(cols: readonly K[]): DataFrame<Pick<T, K>> {
    const newCols = {} as { [PK in K]: T[PK][] };
    for (const col of cols) {
      newCols[col] = this.storage.getColumn(col);
    }
    return new DataFrame<Pick<T, K>>(
      ColumnarStorage.fromUnsafe<Pick<T, K>>(newCols as Record<string, unknown[]>),
      [...this.bitmask],
      [...this.sortIndex],
    );
  }

  rename<M extends Partial<Record<keyof T & string, string>>>(
    mapping: M,
  ): DataFrame<RenameResult<T, M>> {
    type Result = RenameResult<T, M>;
    const newCols: Record<string, unknown[]> = {};

    for (const col of this.storage.columnNames()) {
      const colStr = col as string;
      const newName = (mapping as Record<string, string>)[colStr] ?? colStr;
      newCols[newName] = this.storage.getColumn(col) as unknown[];
    }

    return new DataFrame<Result>(
      ColumnarStorage.fromUnsafe<Result>(newCols),
      [...this.bitmask],
      [...this.sortIndex],
    );
  }

  sort(by: Array<{ col: keyof T; dir: "asc" | "desc" }>): DataFrame<T> {
    const n = this.storage.size();
    const newSortIndex = Array.from({ length: n }, (_, i) => i);

    newSortIndex.sort((a, b) => {
      for (const { col, dir } of by) {
        const colData = this.storage.getColumn(col);
        const aVal = colData[a];
        const bVal = colData[b];
        if (aVal === bVal) continue;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = aVal < bVal ? -1 : 1;
        return dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });

    return new DataFrame(this.storage, [...this.bitmask], newSortIndex);
  }

  groupBy<K extends keyof T>(col: K): GroupedFrame<T, K> {
    return new GroupedFrame(this, col);
  }
}

export function fromRows<T extends Record<string, unknown>>(
  rows: T[],
): DataFrame<T> {
  if (rows.length === 0) {
    return DataFrame._create(
      new ColumnarStorage({} as { [K in keyof T]: T[K][] }),
      [],
      [],
    );
  }

  const keys = Object.keys(rows[0]!) as Array<keyof T>;
  const cols = {} as { [K in keyof T]: T[K][] };
  for (const key of keys) {
    cols[key] = rows.map((row) => row[key]);
  }

  const n = rows.length;
  return DataFrame._create(
    new ColumnarStorage(cols),
    new Array<boolean>(n).fill(true),
    Array.from({ length: n }, (_, i) => i),
  );
}
