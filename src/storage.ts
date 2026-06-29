export interface Storage<T extends Record<string, unknown>> {
  getColumn<K extends keyof T>(col: K): T[K][];
  size(): number;
  columnNames(): Array<keyof T>;
}

export class ColumnarStorage<
  T extends Record<string, unknown>,
> implements Storage<T> {
  private readonly cols: { [K in keyof T]: T[K][] };
  private readonly _columnNames: Array<keyof T>;
  private readonly _size: number;

  constructor(cols: { [K in keyof T]: T[K][] }) {
    this.cols = cols;
    this._columnNames = Object.keys(cols) as Array<keyof T>;
    this._size =
      this._columnNames.length > 0
        ? this.cols[this._columnNames[0]!].length
        : 0;
  }

  getColumn<K extends keyof T>(col: K): T[K][] {
    return this.cols[col];
  }

  size(): number {
    return this._size;
  }

  columnNames(): Array<keyof T> {
    return this._columnNames;
  }

  static fromUnsafe<T extends Record<string, unknown>>(
    cols: Record<string, unknown[]>,
  ): ColumnarStorage<T> {
    return new ColumnarStorage(cols as unknown as { [K in keyof T]: T[K][] });
  }
}
