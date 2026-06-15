import { expect, test } from "bun:test";
import {
  fromRows,
  fromCSV,
  sum,
  mean,
  min,
  max,
  count,
  median,
  DataFrame,
  GroupedFrame,
  ColumnarStorage,
} from "./index";
import type {
  JoinHow,
  DeriveFn,
  DeriveResult,
  RenameResult,
  AggregateResult,
  JoinResult,
  Storage,
} from "./index";

test("public API: fromRows is exported and works end-to-end", () => {
  const df = fromRows([{ name: "Alice", age: 30 }])
    .derive({ senior: (r) => r.age >= 65 })
    .select(["name", "senior"]);
  expect(df.toRows()).toEqual([{ name: "Alice", senior: false }]);
});

test("public API: fromCSV is exported and callable", () => {
  expect(fromCSV("x\n1").toRows()).toEqual([{ x: "1" }]);
});

test("public API: aggregator helpers are exported", () => {
  const rows = [{ v: 10 }, { v: 20 }];
  expect(sum("v")(rows)).toBe(30);
  expect(mean("v")(rows)).toBe(15);
  expect(min("v")(rows)).toBe(10);
  expect(max("v")(rows)).toBe(20);
  expect(count()(rows)).toBe(2);
  expect(median("v")(rows)).toBe(15);
});

test("public API: DataFrame instance methods include all new operations", () => {
  const df = fromRows([{ x: 1 }, { x: 2 }, { x: 3 }]);
  expect(df.size()).toBe(3);
  expect(df.columns()).toEqual(["x"]);
  expect(df.head(1).toRows()).toEqual([{ x: 1 }]);
  expect(df.tail(1).toRows()).toEqual([{ x: 3 }]);
  expect(df.slice(1, 2).toRows()).toEqual([{ x: 2 }]);
  expect(df.drop(["x"]).toRows()).toEqual([{}, {}, {}]);
  expect(df.distinct().size()).toBe(3);
  expect(df.concat(fromRows([{ x: 4 }])).size()).toBe(4);
  expect(df.dropNull().size()).toBe(3);
  expect(df.fillNull({}).size()).toBe(3);
  expect(df.toCSV()).toBe("x\n1\n2\n3");
  expect(df.toJSON()).toBe('[{"x":1},{"x":2},{"x":3}]');
});

test("public API: join is exported on DataFrame", () => {
  const left = fromRows([{ id: 1, val: "a" }]);
  const right = fromRows([{ id: 1, tag: "x" }]);
  expect(left.join(right, { on: "id" }).toRows()).toEqual([
    { id: 1, val: "a", tag: "x" },
  ]);
});

test("public API: JoinHow type is exported and usable", () => {
  const how: JoinHow = "inner";
  expect(how).toBe("inner");
});

test("public API: ColumnarStorage and GroupedFrame are exported", () => {
  const storage = new ColumnarStorage({ x: [1, 2] });
  expect(storage.size()).toBe(2);

  const gf = fromRows([{ dept: "Eng", n: 1 }]).groupBy("dept");
  expect(gf).toBeInstanceOf(GroupedFrame);
});

test("public API: type exports compile without error", () => {
  // Verifies DeriveFn, DeriveResult, RenameResult, AggregateResult, JoinResult, Storage
  // are importable — if any are missing this file fails to typecheck
  const _fn: DeriveFn<{ x: number }> = (r) => r.x * 2;
  expect(_fn({ x: 3 }, 0, [])).toBe(6);
});
