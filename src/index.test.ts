import { expect, test } from "bun:test";
import { fromRows } from "./index";

test("public API: fromRows is exported and works end-to-end", () => {
  const df = fromRows([{ name: "Alice", age: 30 }])
    .derive({ senior: (r) => r.age >= 65 })
    .select(["name", "senior"]);
  expect(df.toRows()).toEqual([{ name: "Alice", senior: false }]);
});
