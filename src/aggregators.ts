export const sum =
  <U extends Record<string, unknown> = Record<string, unknown>>(
    col: keyof U & string,
  ) =>
  (rows: U[]): number =>
    rows.reduce((acc, r) => acc + ((r[col] as number) ?? 0), 0);

export const mean =
  <U extends Record<string, unknown> = Record<string, unknown>>(
    col: keyof U & string,
  ) =>
  (rows: U[]): number => {
    if (rows.length === 0) return 0;
    return sum<U>(col)(rows) / rows.length;
  };

export const min =
  <U extends Record<string, unknown> = Record<string, unknown>>(
    col: keyof U & string,
  ) =>
  (rows: U[]): number | null => {
    let result: number | null = null;
    for (const r of rows) {
      const v = r[col] as number | null;
      if (v != null && (result === null || v < result)) result = v;
    }
    return result;
  };

export const max =
  <U extends Record<string, unknown> = Record<string, unknown>>(
    col: keyof U & string,
  ) =>
  (rows: U[]): number | null => {
    let result: number | null = null;
    for (const r of rows) {
      const v = r[col] as number | null;
      if (v != null && (result === null || v > result)) result = v;
    }
    return result;
  };

export const count =
  () =>
  (rows: unknown[]): number =>
    rows.length;

export const median =
  <U extends Record<string, unknown> = Record<string, unknown>>(
    col: keyof U & string,
  ) =>
  (rows: U[]): number | null => {
    const vals = rows
      .map((r) => r[col] as number | null)
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    if (vals.length === 0) return null;
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 === 0
      ? (vals[mid - 1]! + vals[mid]!) / 2
      : vals[mid]!;
  };
