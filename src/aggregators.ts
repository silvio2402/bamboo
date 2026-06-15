export const sum =
  (col: string) =>
  (rows: Record<string, unknown>[]): number =>
    rows.reduce((acc, r) => acc + ((r[col] as number) ?? 0), 0);

export const mean =
  (col: string) =>
  (rows: Record<string, unknown>[]): number => {
    if (rows.length === 0) return 0;
    return sum(col)(rows) / rows.length;
  };

export const min =
  (col: string) =>
  (rows: Record<string, unknown>[]): number | null => {
    const vals = rows
      .map((r) => r[col] as number | null)
      .filter((v): v is number => v != null);
    return vals.length === 0 ? null : Math.min(...vals);
  };

export const max =
  (col: string) =>
  (rows: Record<string, unknown>[]): number | null => {
    const vals = rows
      .map((r) => r[col] as number | null)
      .filter((v): v is number => v != null);
    return vals.length === 0 ? null : Math.max(...vals);
  };

export const count =
  () =>
  (rows: unknown[]): number =>
    rows.length;

export const median =
  (col: string) =>
  (rows: Record<string, unknown>[]): number | null => {
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
