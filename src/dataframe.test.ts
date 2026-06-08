import { expect, test, describe } from "bun:test";
import { ColumnarStorage } from "./storage";
import { fromRows } from "./dataframe";

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
    const df = fromRows([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }]);
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
});

// ── derive ────────────────────────────────────────────────────────────────────

describe("derive", () => {
  test("adds a new column", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    const result = df.derive({ initials: (r) => r.name[0] });
    expect(result.toRows()).toEqual([{ name: "Alice", age: 30, initials: "A" }]);
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
    const result = df.filter((r) => r.age >= 20).derive({ doubled: (r) => r.age * 2 });
    expect(result.toRows()).toEqual([{ age: 20, doubled: 40 }, { age: 30, doubled: 60 }]);
  });

  test("does not mutate the original", () => {
    const df = fromRows([{ name: "Alice" }]);
    df.derive({ upper: (r) => r.name.toUpperCase() });
    expect(df.toRows()).toEqual([{ name: "Alice" }]);
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
      df.filter((r) => r.age > 27).select(["name"]).toRows(),
    ).toEqual([{ name: "Alice" }]);
  });
});

// ── rename ────────────────────────────────────────────────────────────────────

describe("rename", () => {
  test("renames a column", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    expect(df.rename({ age: "years" }).toRows()).toEqual([
      { name: "Alice", years: 30 },
    ]);
  });

  test("renames multiple columns", () => {
    const df = fromRows([{ a: 1, b: 2 }]);
    expect(df.rename({ a: "x", b: "y" }).toRows()).toEqual([{ x: 1, y: 2 }]);
  });

  test("leaves unmentioned columns unchanged", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    expect(df.rename({ age: "years" }).toRows()).toEqual([
      { name: "Alice", years: 30 },
    ]);
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

  test("does not mutate the original", () => {
    const df = fromRows([{ age: 30 }, { age: 10 }]);
    df.sort([{ col: "age", dir: "asc" }]);
    expect(df.toRows()).toEqual([{ age: 30 }, { age: 10 }]);
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
});
