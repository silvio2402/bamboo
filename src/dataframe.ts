import { ColumnarStorage } from "./storage";
import type { Storage } from "./storage";

export type DeriveFn<T> = (row: T, index: number, allRows: T[]) => unknown;

export type DeriveResult<
  T extends Record<string, unknown>,
  D extends Record<string, DeriveFn<T>>,
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

export type JoinHow = "inner" | "left" | "right" | "outer";

type NullableValues<T> = { [K in keyof T]: T[K] | null };

export type JoinResult<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
  How extends JoinHow,
> = How extends "inner"
  ? T & U
  : How extends "left"
    ? T & NullableValues<U>
    : How extends "right"
      ? NullableValues<T> & U
      : NullableValues<T> & NullableValues<U>;

export class GroupedFrame<
  T extends Record<string, unknown>,
  K extends keyof T,
> {
  constructor(
    private readonly df: DataFrame<T>,
    private readonly keys: ReadonlyArray<K>,
  ) {}

  aggregate<A extends Record<string, (rows: T[]) => unknown>>(
    aggregations: A,
  ): DataFrame<AggregateResult<T, K, A>> {
    type Result = AggregateResult<T, K, A>;

    const rows = this.df.toRows();
    const groups = new Map<string, T[]>();

    for (const row of rows) {
      const groupKey = JSON.stringify(this.keys.map((k) => row[k]));
      if (!groups.has(groupKey)) groups.set(groupKey, []);
      groups.get(groupKey)!.push(row);
    }

    const resultRows: Result[] = [];
    for (const [, groupRows] of groups) {
      const resultRow = {} as unknown as Result;
      for (const k of this.keys) {
        (resultRow as Record<string, unknown>)[k as string] = groupRows[0]![k];
      }
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

  private materializeRows(indices: number[]): DataFrame<T> {
    const newCols: Record<string, unknown[]> = {};
    for (const col of this.storage.columnNames()) {
      const colData = this.storage.getColumn(col);
      newCols[col as string] = indices.map((i) => colData[i]);
    }
    const n = indices.length;
    return new DataFrame<T>(
      ColumnarStorage.fromUnsafe<T>(newCols),
      new Array<boolean>(n).fill(true),
      Array.from({ length: n }, (_, i) => i),
    );
  }

  // ── Introspection ──────────────────────────────────────────────────────────

  size(): number {
    return this.activeIndices().length;
  }

  columns(): Array<keyof T> {
    return this.storage.columnNames();
  }

  // ── Output ─────────────────────────────────────────────────────────────────

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

  toCSV(): string {
    const cols = this.storage.columnNames();
    const header = cols.map((c) => csvEscape(String(c))).join(",");
    const dataRows = this.toRows().map((row) =>
      cols.map((c) => csvEscape(String(row[c] ?? ""))).join(","),
    );
    return [header, ...dataRows].join("\n");
  }

  toJSON(): string {
    return JSON.stringify(this.toRows());
  }

  // ── Row slicing ────────────────────────────────────────────────────────────

  head(n: number): DataFrame<T> {
    return this.materializeRows(this.activeIndices().slice(0, n));
  }

  tail(n: number): DataFrame<T> {
    const active = this.activeIndices();
    return this.materializeRows(active.slice(Math.max(0, active.length - n)));
  }

  slice(start: number, end?: number): DataFrame<T> {
    return this.materializeRows(this.activeIndices().slice(start, end));
  }

  // ── Filtering ──────────────────────────────────────────────────────────────

  filter(fn: (row: T) => boolean): DataFrame<T> {
    const newBitmask = this.bitmask.map((active, i) =>
      active ? fn(this.rowAt(i)) : false,
    );
    return new DataFrame(this.storage, newBitmask, [...this.sortIndex]);
  }

  dropNull(cols?: ReadonlyArray<keyof T>): DataFrame<T> {
    const checkCols = cols ?? this.storage.columnNames();
    return this.filter((row) => checkCols.every((c) => row[c] != null));
  }

  distinct(cols?: ReadonlyArray<keyof T>): DataFrame<T> {
    const keyCols = cols ?? this.storage.columnNames();
    const seen = new Set<string>();
    const kept: number[] = [];
    for (const i of this.activeIndices()) {
      const row = this.rowAt(i);
      const key = JSON.stringify(keyCols.map((c) => row[c]));
      if (!seen.has(key)) {
        seen.add(key);
        kept.push(i);
      }
    }
    return this.materializeRows(kept);
  }

  // ── Column transforms ──────────────────────────────────────────────────────

  derive<D extends Record<string, DeriveFn<T>>>(
    derivations: D,
  ): DataFrame<DeriveResult<T, D>> {
    type Result = DeriveResult<T, D>;
    const n = this.storage.size();
    const newCols: Record<string, unknown[]> = {};

    for (const col of this.storage.columnNames()) {
      newCols[col as string] = this.storage.getColumn(col) as unknown[];
    }

    const activeIdx = this.activeIndices();
    const visibleRows = activeIdx.map((i) => this.rowAt(i));
    const visibleIndexMap = new Map<number, number>(
      activeIdx.map((storageIdx, visibleIdx) => [storageIdx, visibleIdx]),
    );

    for (const key of Object.keys(derivations)) {
      const fn = derivations[key]!;
      const col = new Array<unknown>(n);
      for (let i = 0; i < n; i++) {
        col[i] = fn(this.rowAt(i), visibleIndexMap.get(i) ?? -1, visibleRows);
      }
      newCols[key] = col;
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
      ColumnarStorage.fromUnsafe<Pick<T, K>>(
        newCols as Record<string, unknown[]>,
      ),
      [...this.bitmask],
      [...this.sortIndex],
    );
  }

  drop<K extends keyof T>(cols: readonly K[]): DataFrame<Omit<T, K>> {
    const toDrop = new Set<keyof T>(cols);
    const remaining = this.storage
      .columnNames()
      .filter((c) => !toDrop.has(c)) as Array<Exclude<keyof T, K>>;
    return this.select(remaining) as unknown as DataFrame<Omit<T, K>>;
  }

  rename<const M extends Partial<Record<keyof T & string, string>>>(
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

  fillNull(defaults: Partial<Record<keyof T, unknown>>): DataFrame<T> {
    const n = this.storage.size();
    const newCols: Record<string, unknown[]> = {};

    for (const col of this.storage.columnNames()) {
      const colData = this.storage.getColumn(col) as unknown[];
      const def = (defaults as Record<string, unknown>)[col as string];
      newCols[col as string] =
        def !== undefined ? colData.map((v) => v ?? def) : [...colData];
    }

    return new DataFrame<T>(
      ColumnarStorage.fromUnsafe<T>(newCols),
      [...this.bitmask],
      [...this.sortIndex],
    );
  }

  // ── Sorting ────────────────────────────────────────────────────────────────

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

  // ── Grouping ───────────────────────────────────────────────────────────────

  groupBy<K extends keyof T>(col: K): GroupedFrame<T, K>;
  groupBy<const K extends ReadonlyArray<keyof T>>(
    cols: K,
  ): GroupedFrame<T, K[number]>;
  groupBy(
    colOrCols: keyof T | ReadonlyArray<keyof T>,
  ): GroupedFrame<T, keyof T> {
    const keys = Array.isArray(colOrCols)
      ? (colOrCols as ReadonlyArray<keyof T>)
      : [colOrCols as keyof T];
    return new GroupedFrame(this, keys);
  }

  // ── Combining ──────────────────────────────────────────────────────────────

  concat(...others: DataFrame<T>[]): DataFrame<T> {
    const allRows = [this, ...others].flatMap((df) => df.toRows());
    return fromRows(allRows);
  }

  join<U extends Record<string, unknown>, How extends JoinHow = "inner">(
    other: DataFrame<U>,
    options: { on: keyof T & keyof U; how?: How },
  ): DataFrame<JoinResult<T, U, How>> {
    const how = (options.how ?? "inner") as JoinHow;
    const on = options.on;
    const leftRows = this.toRows();
    const rightRows = other.toRows();

    const rightByKey = new Map<unknown, { row: U; idx: number }[]>();
    rightRows.forEach((row, idx) => {
      const key = row[on];
      if (!rightByKey.has(key)) rightByKey.set(key, []);
      rightByKey.get(key)!.push({ row, idx });
    });

    type Result = JoinResult<T, U, How>;
    const result: Result[] = [];
    const matchedRightIndices = new Set<number>();

    const leftColNames = this.columns();
    const rightColNames = other.columns();

    for (const leftRow of leftRows) {
      const key = leftRow[on];
      const rightMatches = rightByKey.get(key) ?? [];

      if (rightMatches.length > 0) {
        for (const { row: rightRow, idx } of rightMatches) {
          result.push({ ...leftRow, ...rightRow } as Result);
          matchedRightIndices.add(idx);
        }
      } else if (how === "left" || how === "outer") {
        const nullRight = Object.fromEntries(
          rightColNames.filter((c) => c !== on).map((c) => [c, null]),
        );
        result.push({ ...leftRow, ...nullRight } as Result);
      }
    }

    if (how === "right" || how === "outer") {
      rightRows.forEach((rightRow, idx) => {
        if (!matchedRightIndices.has(idx)) {
          const nullLeft = Object.fromEntries(
            leftColNames.filter((c) => c !== on).map((c) => [c, null]),
          );
          result.push({ ...nullLeft, ...rightRow } as Result);
        }
      });
    }

    return fromRows(result);
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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
