# Bamboo — Design Document

Bamboo is a TypeScript data transformation library inspired by pandas, built for data science use cases. It is fully type-safe (perfect autocomplete, no unexpected results), purely functional (immutable, no side effects), and built on a swappable storage abstraction.

---

## Core Abstraction: `DataFrame<T>`

The central type is `DataFrame<T>`, where `T` is a plain object type describing the column schema:

```ts
DataFrame<{ name: string; age: number; score: number | null }>
```

Every operation returns a new `DataFrame` — nothing is ever mutated.

DataFrames are created via factory functions, never `new`:

```ts
const df = fromRows([
  { name: "Alice", age: 30 },
  { name: "Bob", age: 25 },
]);
```

---

## Storage Abstraction

`DataFrame` never accesses raw data directly. It delegates through a `Storage<T>` interface:

```ts
interface Storage<T> {
  getColumn<K extends keyof T>(col: K): T[K][];
  size(): number;
}
```

The default implementation is `ColumnarStorage`, which stores each column as a typed array. Future implementations (e.g. Arrow-backed, row-based, lazy file-backed) can be swapped in without touching `DataFrame` logic.

---

## Metadata Layer

Filter and sort state live in metadata alongside the storage reference — they never mutate the underlying data:

- **Filter**: a bitmask indicating which rows are active
- **Sort**: an index array defining the order to read rows

Both `.toRows()` and `.toColumns()` apply the bitmask and sort index before returning data.

---

## Operations

All operations use a consistent object-key syntax where applicable.

### `derive` — add or overwrite columns

```ts
df.derive({ initials: row => row.name[0] })
df.derive({ age: row => row.age * 2 }) // overwrites existing column
df.derive({ a: row => ..., b: row => ... }) // multiple at once
```

Columns defined in the same `derive` call cannot reference each other — use chained calls for dependent columns.

Return type is fully inferred: `DataFrame<T & { initials: string }>`.

### `select` — pick a subset of columns

```ts
df.select(["name", "initials"])
// → DataFrame<{ name: string; initials: string }>
```

Column names are constrained to `keyof T`.

### `filter` — keep matching rows

```ts
df.filter(row => row.age > 18)
```

Updates the bitmask in metadata. Schema is unchanged.

### `rename` — rename columns

```ts
df.rename({ age: "years" })
// → DataFrame<{ name: string; years: number }>
```

Keys are constrained to `keyof T`, values are the new names.

### `sort` — order rows

```ts
df.sort([{ col: "country", dir: "asc" }, { col: "age", dir: "desc" }])
```

Updates the sort index in metadata. Supports multi-column sorting.

### `groupBy` + `aggregate` — group and reduce

```ts
df.groupBy("country")
  .aggregate({ avgAge: rows => mean(rows.map(r => r.age)) })
// → DataFrame<{ country: string; avgAge: number }>
```

`groupBy` returns an intermediate `GroupedFrame<T, K>`. `aggregate` takes an object of named aggregation functions, each receiving the array of rows in the group. The result is a new `DataFrame` with group keys plus aggregated columns.

---

## Output

```ts
df.toRows()    // → T[]
df.toColumns() // → { [K in keyof T]: T[K][] }
```

Both apply the current bitmask and sort index.

---

## Null Handling

`null` is allowed naturally in column types:

```ts
DataFrame<{ score: number | null }>
```

TypeScript propagates nullability through operations automatically — a `derive` over a nullable column will produce a nullable result unless the row function explicitly handles it.

---

## Type Inference Examples

```ts
const df = fromRows([{ name: "Alice", age: 30 }])
// DataFrame<{ name: string; age: number }>

const df2 = df.derive({ initials: row => row.name[0] })
// DataFrame<{ name: string; age: number; initials: string }>

const df3 = df2.select(["name", "initials"])
// DataFrame<{ name: string; initials: string }>

const df4 = df3.rename({ initials: "short" })
// DataFrame<{ name: string; short: string }>
```

---

## Deferred / Future Work

- **Joins** — joining two DataFrames on a key
- **Pivot** — reshaping data (wide ↔ long)
- **Vectorized column functions** — escape hatch for performance-critical aggregations operating on full column arrays
