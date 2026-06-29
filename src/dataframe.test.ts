import { expect, test, describe } from "bun:test";
import { ColumnarStorage } from "./storage";
import { fromRows } from "./dataframe";
import { sum, mean, min, max, count, median } from "./aggregators";

// ── Storage ──────────────────────────────────────────────────────────────────

describe("ColumnarStorage", () => {
  test("stores and retrieves columns", () => {
    const s = new ColumnarStorage({ name: ["Alice", "Bob"], age: [30, 25] });
    expect(s.getColumn("name")).toEqual(["Alice", "Bob"]);
    expect(s.getColumn("age")).toEqual([30, 25]);
  });

  test("reports correct size", () => {
    const s = new ColumnarStorage({ name: ["Alice", "Bob"], age: [30, 25] });
    expect(s.size()).toBe(2);
  });

  test("reports column names", () => {
    const s = new ColumnarStorage({ name: ["Alice"], age: [30] });
    expect(s.columnNames()).toEqual(["name", "age"]);
  });

  test("empty storage has size 0", () => {
    const s = new ColumnarStorage({} as Record<never, never[]>);
    expect(s.size()).toBe(0);
  });
});

// ── fromRows / toRows / toColumns ─────────────────────────────────────────────

describe("fromRows", () => {
  test("toRows round-trips the input", () => {
    const rows = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    expect(fromRows(rows).toRows()).toEqual(rows);
  });

  test("toColumns returns data by column", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    expect(df.toColumns()).toEqual({ name: ["Alice", "Bob"], age: [30, 25] });
  });

  test("handles a single row", () => {
    const df = fromRows([{ x: 1 }]);
    expect(df.toRows()).toEqual([{ x: 1 }]);
  });

  test("handles null values", () => {
    const df = fromRows([{ name: "Alice", score: null }]);
    expect(df.toRows()).toEqual([{ name: "Alice", score: null }]);
  });

  test("handles empty array", () => {
    expect(fromRows([]).toRows()).toEqual([]);
    expect(fromRows<Record<string, unknown>>([]).toColumns()).toEqual({});
  });
});

// ── introspection ─────────────────────────────────────────────────────────────

describe("size", () => {
  test("returns total row count", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(df.size()).toBe(3);
  });

  test("returns count of active rows after filter", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(df.filter((r) => r.x > 1).size()).toBe(2);
  });

  test("returns 0 for empty DataFrame", () => {
    expect(fromRows([]).size()).toBe(0);
  });
});

describe("columns", () => {
  test("returns column names", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    expect(df.columns()).toEqual(["name", "age"]);
  });

  test("returns empty array for empty DataFrame", () => {
    expect(fromRows([]).columns()).toEqual([]);
  });
});

// ── head / tail / slice ───────────────────────────────────────────────────────

describe("head", () => {
  test("returns first n rows", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(df.head(2).toRows()).toEqual([{ x: 1 }, { x: 2 }]);
  });

  test("works after filter", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }]);
    expect(
      df
        .filter((r) => r.x > 1)
        .head(2)
        .toRows(),
    ).toEqual([{ x: 2 }, { x: 3 }]);
  });

  test("works after sort", () => {
    const df = fromRows([{ x: 3 }, { x: 1 }, { x: 2 }]);
    expect(
      df
        .sort([{ col: "x", dir: "asc" }])
        .head(2)
        .toRows(),
    ).toEqual([{ x: 1 }, { x: 2 }]);
  });

  test("returns empty for head(0)", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }]);
    expect(df.head(0).toRows()).toEqual([]);
  });

  test("returns all rows when n exceeds size", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }]);
    expect(df.head(100).toRows()).toEqual([{ x: 1 }, { x: 2 }]);
  });

  test("returns empty for empty DataFrame", () => {
    expect(fromRows<{ x: number }>([]).head(5).toRows()).toEqual([]);
  });
});

describe("tail", () => {
  test("returns last n rows", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(df.tail(2).toRows()).toEqual([{ x: 2 }, { x: 3 }]);
  });

  test("works after filter", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }]);
    expect(
      df
        .filter((r) => r.x > 1)
        .tail(2)
        .toRows(),
    ).toEqual([{ x: 3 }, { x: 4 }]);
  });

  test("returns empty for tail(0)", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }]);
    expect(df.tail(0).toRows()).toEqual([]);
  });

  test("returns all rows when n exceeds size", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }]);
    expect(df.tail(100).toRows()).toEqual([{ x: 1 }, { x: 2 }]);
  });

  test("returns empty for empty DataFrame", () => {
    expect(fromRows<{ x: number }>([]).tail(5).toRows()).toEqual([]);
  });
});

describe("slice", () => {
  test("returns rows in range", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }]);
    expect(df.slice(1, 3).toRows()).toEqual([{ x: 2 }, { x: 3 }]);
  });

  test("omitting end returns to last row", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(df.slice(1).toRows()).toEqual([{ x: 2 }, { x: 3 }]);
  });

  test("works after filter", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }, { x: 5 }]);
    expect(
      df
        .filter((r) => r.x > 1)
        .slice(1, 3)
        .toRows(),
    ).toEqual([{ x: 3 }, { x: 4 }]);
  });

  test("returns empty for slice(0, 0)", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }]);
    expect(df.slice(0, 0).toRows()).toEqual([]);
  });

  test("returns empty when start exceeds size", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }]);
    expect(df.slice(10).toRows()).toEqual([]);
  });
});

// ── filter ────────────────────────────────────────────────────────────────────

describe("filter", () => {
  test("keeps matching rows", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    expect(df.filter((r) => r.age > 27).toRows()).toEqual([
      { name: "Alice", age: 30 },
    ]);
  });

  test("does not mutate the original", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    df.filter((r) => r.age > 27);
    expect(df.toRows()).toHaveLength(2);
  });

  test("chained filters compose correctly", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
      { name: "Charlie", age: 35 },
    ]);
    const result = df
      .filter((r) => r.age > 24)
      .filter((r) => r.name !== "Charlie");
    expect(result.toRows()).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
  });

  test("returns empty when nothing matches", () => {
    const df = fromRows([{ age: 10 }, { age: 20 }]);
    expect(df.filter((r) => r.age > 100).toRows()).toEqual([]);
  });

  test("handles empty DataFrame", () => {
    expect(
      fromRows<{ age: number }>([])
        .filter((r) => r.age > 0)
        .toRows(),
    ).toEqual([]);
  });
});

// ── dropNull ──────────────────────────────────────────────────────────────────

describe("dropNull", () => {
  test("removes rows with any null value", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: null },
      { name: null, age: 25 },
    ]);
    expect(df.dropNull().toRows()).toEqual([{ name: "Alice", age: 30 }]);
  });

  test("removes rows with null in specified columns only", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: null },
      { name: null, age: 25 },
    ]);
    expect(df.dropNull(["age"]).toRows()).toEqual([
      { name: "Alice", age: 30 },
      { name: null, age: 25 },
    ]);
  });

  test("does not mutate the original", () => {
    const df = fromRows([{ x: 1 }, { x: null }]);
    df.dropNull();
    expect(df.toRows()).toHaveLength(2);
  });

  test("handles empty DataFrame", () => {
    expect(fromRows<{ x: number | null }>([]).dropNull().toRows()).toEqual([]);
  });
});

// ── fillNull ──────────────────────────────────────────────────────────────────

describe("fillNull", () => {
  test("replaces null values with defaults", () => {
    const df = fromRows([
      { name: "Alice", score: null },
      { name: "Bob", score: 80 },
    ]);
    expect(df.fillNull({ score: 0 }).toRows()).toEqual([
      { name: "Alice", score: 0 },
      { name: "Bob", score: 80 },
    ]);
  });

  test("only fills specified columns", () => {
    const df = fromRows([
      { name: null as string | null, score: null as number | null },
    ]);
    expect(df.fillNull({ score: 0 }).toRows()).toEqual([
      { name: null, score: 0 },
    ]);
  });

  test("does not mutate the original", () => {
    const df = fromRows<{ x: number | null }>([{ x: null }]);
    df.fillNull({ x: 0 });
    expect(df.toRows()).toEqual([{ x: null }]);
  });

  test("handles empty DataFrame", () => {
    expect(
      fromRows<{ x: number | null }>([]).fillNull({ x: 0 }).toRows(),
    ).toEqual([]);
  });
});

// ── distinct ──────────────────────────────────────────────────────────────────

describe("distinct", () => {
  test("removes duplicate rows", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    expect(df.distinct().toRows()).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
  });

  test("deduplicates by specified columns", () => {
    const df = fromRows([
      { name: "Alice", dept: "Eng" },
      { name: "Bob", dept: "Eng" },
      { name: "Carol", dept: "Sales" },
    ]);
    expect(df.distinct(["dept"]).toRows()).toEqual([
      { name: "Alice", dept: "Eng" },
      { name: "Carol", dept: "Sales" },
    ]);
  });

  test("works after filter", () => {
    const df = fromRows([
      { x: 1, y: "a" },
      { x: 2, y: "a" },
      { x: 3, y: "b" },
    ]);
    expect(
      df
        .filter((r) => r.x > 1)
        .distinct(["y"])
        .toRows(),
    ).toEqual([
      { x: 2, y: "a" },
      { x: 3, y: "b" },
    ]);
  });

  test("all identical rows reduces to one row", () => {
    const df = fromRows([{ x: 1 }, { x: 1 }, { x: 1 }]);
    expect(df.distinct().toRows()).toEqual([{ x: 1 }]);
  });

  test("does not mutate the original", () => {
    const df = fromRows([{ x: 1 }, { x: 1 }]);
    df.distinct();
    expect(df.toRows()).toHaveLength(2);
  });

  test("handles empty DataFrame", () => {
    expect(fromRows<{ x: number }>([]).distinct().toRows()).toEqual([]);
  });
});

// ── derive ────────────────────────────────────────────────────────────────────

describe("derive", () => {
  test("adds a new column", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    const result = df.derive({ initials: (r) => r.name[0] });
    expect(result.toRows()).toEqual([
      { name: "Alice", age: 30, initials: "A" },
    ]);
  });

  test("overwrites an existing column", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    const result = df.derive({ age: (r) => r.age * 2 });
    expect(result.toRows()).toEqual([{ name: "Alice", age: 60 }]);
  });

  test("adds multiple columns at once", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    const result = df.derive({
      initials: (r) => r.name[0],
      doubled: (r) => r.age * 2,
    });
    expect(result.toRows()).toEqual([
      { name: "Alice", age: 30, initials: "A", doubled: 60 },
    ]);
  });

  test("respects active filter", () => {
    const df = fromRows([{ age: 10 }, { age: 20 }, { age: 30 }]);
    const result = df
      .filter((r) => r.age >= 20)
      .derive({ doubled: (r) => r.age * 2 });
    expect(result.toRows()).toEqual([
      { age: 20, doubled: 40 },
      { age: 30, doubled: 60 },
    ]);
  });

  test("does not mutate the original", () => {
    const df = fromRows([{ name: "Alice" }]);
    df.derive({ upper: (r) => r.name.toUpperCase() });
    expect(df.toRows()).toEqual([{ name: "Alice" }]);
  });

  test("passes visible index and allRows for window functions", () => {
    const df = fromRows([{ val: 10 }, { val: 20 }, { val: 30 }]);
    const result = df.derive({
      cumsum: (_, i, rows) =>
        rows.slice(0, i + 1).reduce((s, r) => s + r.val, 0),
    });
    expect(result.toRows()).toEqual([
      { val: 10, cumsum: 10 },
      { val: 20, cumsum: 30 },
      { val: 30, cumsum: 60 },
    ]);
  });

  test("window functions see only filtered rows", () => {
    const df = fromRows([{ val: 10 }, { val: 20 }, { val: 30 }]);
    const result = df
      .filter((r) => r.val >= 20)
      .derive({ rank: (_, i) => i + 1 });
    expect(result.toRows()).toEqual([
      { val: 20, rank: 1 },
      { val: 30, rank: 2 },
    ]);
  });
});

// ── select ────────────────────────────────────────────────────────────────────

describe("select", () => {
  test("picks a subset of columns", () => {
    const df = fromRows([{ name: "Alice", age: 30, score: 100 }]);
    expect(df.select(["name", "age"]).toRows()).toEqual([
      { name: "Alice", age: 30 },
    ]);
  });

  test("preserves filter when selecting", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    expect(
      df
        .filter((r) => r.age > 27)
        .select(["name"])
        .toRows(),
    ).toEqual([{ name: "Alice" }]);
  });

  test("select([]) returns rows with no columns", () => {
    const df = fromRows([{ name: "Alice" }, { name: "Bob" }]);
    expect(df.select([]).toRows()).toEqual([{}, {}]);
  });
});

// ── drop ──────────────────────────────────────────────────────────────────────

describe("drop", () => {
  test("removes specified columns", () => {
    const df = fromRows([{ name: "Alice", age: 30, score: 100 }]);
    expect(df.drop(["score"]).toRows()).toEqual([{ name: "Alice", age: 30 }]);
  });

  test("removes multiple columns", () => {
    const df = fromRows([{ a: 1, b: 2, c: 3 }]);
    expect(df.drop(["a", "c"]).toRows()).toEqual([{ b: 2 }]);
  });

  test("preserves filter", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    expect(
      df
        .filter((r) => r.age > 27)
        .drop(["age"])
        .toRows(),
    ).toEqual([{ name: "Alice" }]);
  });

  test("drop([]) is a no-op", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    expect(df.drop([]).toRows()).toEqual([{ name: "Alice", age: 30 }]);
  });
});

// ── rename ────────────────────────────────────────────────────────────────────

describe("rename", () => {
  test("renames a column, leaving others unchanged", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    expect(df.rename({ age: "years" }).toRows()).toEqual([
      { name: "Alice", years: 30 },
    ]);
  });

  test("renames multiple columns", () => {
    const df = fromRows([{ a: 1, b: 2 }]);
    expect(df.rename({ a: "x", b: "y" }).toRows()).toEqual([{ x: 1, y: 2 }]);
  });

  test("renaming to an existing column name silently overwrites it", () => {
    const df = fromRows([{ a: 1, b: 2 }]);
    // "a" is renamed to "b"; the original "b" column is processed second and wins
    expect(df.rename({ a: "b" }).toRows()).toEqual([{ b: 2 }]);
  });
});

// ── sort ──────────────────────────────────────────────────────────────────────

describe("sort", () => {
  test("sorts ascending", () => {
    const df = fromRows([{ age: 30 }, { age: 25 }, { age: 35 }]);
    expect(df.sort([{ col: "age", dir: "asc" }]).toRows()).toEqual([
      { age: 25 },
      { age: 30 },
      { age: 35 },
    ]);
  });

  test("sorts descending", () => {
    const df = fromRows([{ age: 30 }, { age: 25 }, { age: 35 }]);
    expect(df.sort([{ col: "age", dir: "desc" }]).toRows()).toEqual([
      { age: 35 },
      { age: 30 },
      { age: 25 },
    ]);
  });

  test("multi-column sort", () => {
    const df = fromRows([
      { country: "US", age: 30 },
      { country: "UK", age: 25 },
      { country: "US", age: 20 },
    ]);
    const result = df
      .sort([
        { col: "country", dir: "asc" },
        { col: "age", dir: "asc" },
      ])
      .toRows();
    expect(result).toEqual([
      { country: "UK", age: 25 },
      { country: "US", age: 20 },
      { country: "US", age: 30 },
    ]);
  });

  test("sort respects existing filter", () => {
    const df = fromRows([{ age: 30 }, { age: 10 }, { age: 20 }]);
    const result = df
      .filter((r) => r.age >= 20)
      .sort([{ col: "age", dir: "asc" }])
      .toRows();
    expect(result).toEqual([{ age: 20 }, { age: 30 }]);
  });

  test("puts nulls last", () => {
    const df = fromRows([{ age: 30 }, { age: null }, { age: 10 }]);
    const result = df.sort([{ col: "age", dir: "asc" }]).toRows();
    expect(result).toEqual([{ age: 10 }, { age: 30 }, { age: null }]);
  });

  test("preserves insertion order for equal sort keys (stable sort)", () => {
    const df = fromRows([
      { name: "Bob", age: 30 },
      { name: "Alice", age: 30 },
    ]);
    expect(df.sort([{ col: "age", dir: "asc" }]).toRows()).toEqual([
      { name: "Bob", age: 30 },
      { name: "Alice", age: 30 },
    ]);
  });

  test("does not mutate the original", () => {
    const df = fromRows([{ age: 30 }, { age: 10 }]);
    df.sort([{ col: "age", dir: "asc" }]);
    expect(df.toRows()).toEqual([{ age: 30 }, { age: 10 }]);
  });
});

// ── concat ────────────────────────────────────────────────────────────────────

describe("concat", () => {
  test("stacks two DataFrames vertically", () => {
    const df1 = fromRows([{ name: "Alice", age: 30 }]);
    const df2 = fromRows([{ name: "Bob", age: 25 }]);
    expect(df1.concat(df2).toRows()).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
  });

  test("stacks multiple DataFrames", () => {
    const df1 = fromRows([{ x: 1 }]);
    const df2 = fromRows([{ x: 2 }]);
    const df3 = fromRows([{ x: 3 }]);
    expect(df1.concat(df2, df3).toRows()).toEqual([
      { x: 1 },
      { x: 2 },
      { x: 3 },
    ]);
  });

  test("respects filter on source DataFrames", () => {
    const df1 = fromRows([{ x: 1 }, { x: 2 }]).filter((r) => r.x > 1);
    const df2 = fromRows([{ x: 3 }]);
    expect(df1.concat(df2).toRows()).toEqual([{ x: 2 }, { x: 3 }]);
  });

  test("concat() with no arguments returns a materialized copy", () => {
    const df = fromRows([{ x: 1 }, { x: 2 }]);
    expect(df.concat().toRows()).toEqual([{ x: 1 }, { x: 2 }]);
  });

  test("does not mutate the original", () => {
    const df1 = fromRows([{ x: 1 }]);
    const df2 = fromRows([{ x: 2 }]);
    df1.concat(df2);
    expect(df1.toRows()).toHaveLength(1);
  });
});

// ── aggregation helpers ───────────────────────────────────────────────────────

describe("aggregation helpers", () => {
  const rows = [{ val: 10 }, { val: 20 }, { val: 30 }];

  test("sum", () => {
    expect(sum("val")(rows)).toBe(60);
  });

  test("mean", () => {
    expect(mean("val")(rows)).toBe(20);
  });

  test("min", () => {
    expect(min("val")(rows)).toBe(10);
  });

  test("max", () => {
    expect(max("val")(rows)).toBe(30);
  });

  test("count", () => {
    expect(count()(rows)).toBe(3);
  });

  test("median odd count", () => {
    expect(median("val")(rows)).toBe(20);
  });

  test("median even count", () => {
    expect(median("val")([{ val: 10 }, { val: 20 }])).toBe(15);
  });

  test("min/max return null for empty", () => {
    expect(min("val")([])).toBeNull();
    expect(max("val")([])).toBeNull();
  });

  test("median returns null for empty", () => {
    expect(median("val")([])).toBeNull();
  });

  // null semantics
  test("sum treats nulls as 0", () => {
    expect(sum("val")([{ val: 10 }, { val: null }])).toBe(10);
  });

  test("mean treats nulls as 0 (counts toward denominator)", () => {
    expect(mean("val")([{ val: 10 }, { val: null }])).toBe(5);
  });

  test("mean returns 0 for empty input", () => {
    expect(mean("val")([])).toBe(0);
  });

  test("min skips nulls", () => {
    expect(min("val")([{ val: 10 }, { val: null }])).toBe(10);
  });

  test("max skips nulls", () => {
    expect(max("val")([{ val: 10 }, { val: null }])).toBe(10);
  });

  test("median skips nulls", () => {
    expect(median("val")([{ val: 10 }, { val: null }])).toBe(10);
  });

  test("helpers work inside groupBy aggregate", () => {
    const df = fromRows([
      { dept: "Eng", salary: 100 },
      { dept: "Eng", salary: 200 },
      { dept: "HR", salary: 50 },
    ]);
    const result = df
      .groupBy("dept")
      .aggregate({ total: sum("salary"), n: count() })
      .sort([{ col: "dept", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { dept: "Eng", total: 300, n: 2 },
      { dept: "HR", total: 50, n: 1 },
    ]);
  });
});

// ── groupBy + aggregate ───────────────────────────────────────────────────────

describe("groupBy + aggregate", () => {
  test("groups by a column and aggregates", () => {
    const df = fromRows([
      { country: "US", age: 30 },
      { country: "US", age: 20 },
      { country: "UK", age: 25 },
    ]);
    const result = df
      .groupBy("country")
      .aggregate({
        avgAge: (rows) => rows.reduce((s, r) => s + r.age, 0) / rows.length,
      })
      .sort([{ col: "country", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { country: "UK", avgAge: 25 },
      { country: "US", avgAge: 25 },
    ]);
  });

  test("result is a regular DataFrame (further chaining works)", () => {
    const df = fromRows([
      { category: "A", value: 10 },
      { category: "A", value: 20 },
      { category: "B", value: 5 },
    ]);
    const result = df
      .groupBy("category")
      .aggregate({ total: (rows) => rows.reduce((s, r) => s + r.value, 0) })
      .filter((r) => r.total > 10)
      .toRows();
    expect(result).toEqual([{ category: "A", total: 30 }]);
  });

  test("respects filter before grouping", () => {
    const df = fromRows([
      { country: "US", age: 30 },
      { country: "US", age: 20 },
      { country: "UK", age: 25 },
    ]);
    const result = df
      .filter((r) => r.country === "US")
      .groupBy("country")
      .aggregate({ count: (rows) => rows.length })
      .toRows();
    expect(result).toEqual([{ country: "US", count: 2 }]);
  });

  test("groups by multiple columns", () => {
    const df = fromRows([
      { country: "US", dept: "Eng", n: 10 },
      { country: "US", dept: "Eng", n: 5 },
      { country: "US", dept: "HR", n: 3 },
      { country: "UK", dept: "Eng", n: 7 },
    ]);
    const result = df
      .groupBy(["country", "dept"])
      .aggregate({ total: (rows) => rows.reduce((s, r) => s + r.n, 0) })
      .sort([
        { col: "country", dir: "asc" },
        { col: "dept", dir: "asc" },
      ])
      .toRows();
    expect(result).toEqual([
      { country: "UK", dept: "Eng", total: 7 },
      { country: "US", dept: "Eng", total: 15 },
      { country: "US", dept: "HR", total: 3 },
    ]);
  });

  test("multi-column groupBy respects filter before grouping", () => {
    const df = fromRows([
      { country: "US", dept: "Eng", n: 10 },
      { country: "US", dept: "HR", n: 5 },
      { country: "UK", dept: "Eng", n: 7 },
    ]);
    const result = df
      .filter((r) => r.country === "US")
      .groupBy(["country", "dept"])
      .aggregate({ total: (rows) => rows.reduce((s, r) => s + r.n, 0) })
      .sort([{ col: "dept", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { country: "US", dept: "Eng", total: 10 },
      { country: "US", dept: "HR", total: 5 },
    ]);
  });

  test("returns empty DataFrame when source is empty", () => {
    const df = fromRows<{ dept: string; val: number }>([]);
    expect(
      df
        .groupBy("dept")
        .aggregate({ total: sum("val") })
        .toRows(),
    ).toEqual([]);
  });
});

// ── join ──────────────────────────────────────────────────────────────────────

describe("join", () => {
  const employees = fromRows([
    { id: 1, name: "Alice", deptId: 10 },
    { id: 2, name: "Bob", deptId: 20 },
    { id: 3, name: "Carol", deptId: 10 },
  ]);

  const departments = fromRows([
    { deptId: 10, dept: "Engineering" },
    { deptId: 20, dept: "Marketing" },
    { deptId: 30, dept: "Sales" },
  ]);

  test("inner join matches rows on key", () => {
    const result = employees
      .join(departments, { on: "deptId" })
      .sort([{ col: "id", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { id: 1, name: "Alice", deptId: 10, dept: "Engineering" },
      { id: 2, name: "Bob", deptId: 20, dept: "Marketing" },
      { id: 3, name: "Carol", deptId: 10, dept: "Engineering" },
    ]);
  });

  test("inner join excludes unmatched rows from both sides", () => {
    const result = employees.join(departments, { on: "deptId" }).toRows();
    expect(result.map((r) => r.dept)).not.toContain("Sales");
    expect(result.every((r) => r.dept != null)).toBe(true);
  });

  test("inner join one-to-many produces multiple output rows", () => {
    const left = fromRows([{ id: 1, name: "Alice" }]);
    const right = fromRows([
      { id: 1, tag: "A" },
      { id: 1, tag: "B" },
    ]);
    const result = left
      .join(right, { on: "id" })
      .sort([{ col: "tag", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { id: 1, name: "Alice", tag: "A" },
      { id: 1, name: "Alice", tag: "B" },
    ]);
  });

  test("left join keeps all left rows with nulls for unmatched right", () => {
    const leftDf = fromRows([
      { id: 1, deptId: 10 },
      { id: 4, deptId: 99 },
    ]);
    const result = leftDf
      .join(departments, { on: "deptId", how: "left" })
      .sort([{ col: "id", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { id: 1, deptId: 10, dept: "Engineering" },
      { id: 4, deptId: 99, dept: null },
    ]);
  });

  test("left join one-to-many produces multiple output rows", () => {
    const left = fromRows([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
    const right = fromRows([
      { id: 1, tag: "A" },
      { id: 1, tag: "B" },
    ]);
    const result = left
      .join(right, { on: "id", how: "left" })
      .sort([
        { col: "name", dir: "asc" },
        { col: "tag", dir: "asc" },
      ])
      .toRows();
    expect(result).toEqual([
      { id: 1, name: "Alice", tag: "A" },
      { id: 1, name: "Alice", tag: "B" },
      { id: 2, name: "Bob", tag: null },
    ]);
  });

  test("right join keeps all right rows with nulls for unmatched left", () => {
    const leftDf = fromRows([{ deptId: 10, lead: "Alice" }]);
    const result = leftDf
      .join(departments, { on: "deptId", how: "right" })
      .sort([{ col: "deptId", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { deptId: 10, lead: "Alice", dept: "Engineering" },
      { deptId: 20, lead: null, dept: "Marketing" },
      { deptId: 30, lead: null, dept: "Sales" },
    ]);
  });

  test("outer join keeps all rows from both sides", () => {
    const left = fromRows([
      { id: 1, deptId: 10 },
      { id: 2, deptId: 99 },
    ]);
    const right = fromRows([
      { deptId: 10, dept: "Engineering" },
      { deptId: 30, dept: "Sales" },
    ]);
    const result = left
      .join(right, { on: "deptId", how: "outer" })
      .sort([{ col: "deptId", dir: "asc" }])
      .toRows();
    expect(result).toEqual([
      { id: 1, deptId: 10, dept: "Engineering" },
      { id: null, deptId: 30, dept: "Sales" },
      { id: 2, deptId: 99, dept: null },
    ]);
  });

  test("result is a regular DataFrame (further chaining works)", () => {
    const result = employees
      .join(departments, { on: "deptId" })
      .filter((r) => r.dept === "Engineering")
      .toRows();
    expect(result).toHaveLength(2);
  });
});
