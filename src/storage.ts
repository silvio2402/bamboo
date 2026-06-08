export interface Storage<T extends Record<string, unknown>> {
  getColumn<K extends keyof T>(col: K): T[K][];
  size(): number;
  columnNames(): Array<keyof T>;
}

export class ColumnarStorage<T extends Record<string, unknown>>
  implements Storage<T>
{
  private readonly cols: { [K in keyof T]: T[K][] };

  constructor(cols: { [K in keyof T]: T[K][] }) {
    this.cols = cols;
  }

  getColumn<K extends keyof T>(col: K): T[K][] {
    return this.cols[col];
  }

  size(): number {
    const keys = Object.keys(this.cols) as Array<keyof T>;
    if (keys.length === 0) return 0;
    return (this.cols[keys[0]!] as unknown[]).length;
  }

  columnNames(): Array<keyof T> {
    return Object.keys(this.cols) as Array<keyof T>;
  }

  static fromUnsafe<T extends Record<string, unknown>>(
    cols: Record<string, unknown[]>,
  ): ColumnarStorage<T> {
    return new ColumnarStorage(cols as unknown as { [K in keyof T]: T[K][] });
  }
}
