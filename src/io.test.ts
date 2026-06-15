import { expect, test, describe } from "bun:test";
import { fromRows } from "./dataframe";
import { fromCSV } from "./io";

describe("fromCSV", () => {
  test("parses basic CSV", () => {
    const csv = "name,age\nAlice,30\nBob,25";
    expect(fromCSV(csv).toRows()).toEqual([
      { name: "Alice", age: "30" },
      { name: "Bob", age: "25" },
    ]);
  });

  test("handles quoted fields containing commas", () => {
    const csv = 'name,bio\nAlice,"Hello, world"';
    expect(fromCSV(csv).toRows()).toEqual([
      { name: "Alice", bio: "Hello, world" },
    ]);
  });

  test("handles escaped double quotes", () => {
    const csv = 'name,quote\nAlice,"Says ""hi"""';
    expect(fromCSV(csv).toRows()).toEqual([
      { name: "Alice", quote: 'Says "hi"' },
    ]);
  });

  test("skips empty lines", () => {
    const csv = "name,age\nAlice,30\n\nBob,25\n";
    expect(fromCSV(csv).toRows()).toHaveLength(2);
  });

  test("returns an empty DataFrame for headers-only CSV", () => {
    const csv = "name,age";
    expect(fromCSV(csv).toRows()).toEqual([]);
  });
});

describe("toCSV", () => {
  test("serializes rows to CSV", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    expect(df.toCSV()).toBe("name,age\nAlice,30");
  });

  test("serializes multiple rows", () => {
    const df = fromRows([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    expect(df.toCSV()).toBe("name,age\nAlice,30\nBob,25");
  });

  test("escapes values containing commas", () => {
    const df = fromRows([{ name: "Smith, John" }]);
    expect(df.toCSV()).toBe('name\n"Smith, John"');
  });

  test("escapes values containing double quotes", () => {
    const df = fromRows([{ name: 'Says "hi"' }]);
    expect(df.toCSV()).toBe('name\n"Says ""hi"""');
  });

  test("round-trips through fromCSV", () => {
    const df = fromRows([
      { name: "Alice", city: "New York" },
      { name: "Bob", city: "London" },
    ]);
    const csv = df.toCSV();
    expect(fromCSV(csv).toRows()).toEqual([
      { name: "Alice", city: "New York" },
      { name: "Bob", city: "London" },
    ]);
  });
});

describe("toJSON", () => {
  test("serializes rows to JSON", () => {
    const df = fromRows([{ name: "Alice", age: 30 }]);
    expect(df.toJSON()).toBe('[{"name":"Alice","age":30}]');
  });

  test("returns empty array for empty DataFrame", () => {
    const df = fromRows([]);
    expect(df.toJSON()).toBe("[]");
  });
});
