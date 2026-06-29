# 🎋 Bamboo — Architecture & Design

> **The Blueprint of a Lightning-Fast DataFrame Engine.**
>
> Bamboo is engineered for maximum performance, uncompromising type-safety, and a purely functional developer experience. This document outlines the core architectural principles that make Bamboo unique.

---

## 🏛️ Core Philosophy

Bamboo was built to solve the "type-safety gap" in JavaScript data wrangling. Unlike other libraries that treat data as a black box of `any`, Bamboo treats your data schema as a first-class citizen.

### 1. Zero-Copy by Default
Immutability shouldn't come at a performance cost. Bamboo uses a **Metadata Layer** (bitmasks and sort indices) to represent transformations. When you `.filter()` or `.sort()`, we don't copy your gigabytes of data; we simply update a small array of pointers.

### 2. Purely Functional API
Every operation returns a brand new `DataFrame` instance. There are zero side effects, making your data pipelines predictable, testable, and easy to reason about.

### 3. Columnar Storage
Bamboo stores data vertically (column-by-column) rather than horizontally (row-by-row). This aligns with modern CPU cache architectures and allows for massive speedups in aggregations and filtering.

---

## 🧩 The `DataFrame<T>` Abstraction

The `DataFrame<T>` is the heart of the library. The generic `T` is a plain object type that describes your column schema:

```ts
DataFrame<{ 
  country: string; 
  year: number; 
  gdp: number | null 
}>
```

### Type Propagation
Bamboo uses advanced TypeScript features (Mapped Types, Recursive Types, and Type Inferencing) to ensure that your schema flows through every operation:

- **`.select()`**: Returns a `Pick<T, K>`.
- **`.drop()`**: Returns an `Omit<T, K>`.
- **`.derive()`**: Dynamically calculates the resulting intersection type.
- **`.join()`**: Calculates the resulting schema based on the join type (`inner`, `left`, `right`, `outer`).

---

## 💾 Storage Layer & Abstraction

Bamboo is designed with a swappable storage backend. The `DataFrame` logic is decoupled from how the data is actually held in memory via the `Storage<T>` interface:

```ts
interface Storage<T> {
  getColumn<K extends keyof T>(col: K): T[K][];
  columnNames(): Array<keyof T & string>;
  size(): number;
}
```

### `ColumnarStorage`
The default implementation stores each column as a raw JavaScript array. This is optimized for V8's hidden classes and provides O(1) access to column data.

---

## ⚡ The Execution Engine

Bamboo employs a "Materialize On-Demand" strategy.

### 1. Bitmask Filtering
When you call `.filter(row => row.age > 30)`, Bamboo generates a `boolean[]` bitmask. This mask is stored in the new `DataFrame` instance. The underlying data remains untouched.

### 2. Sort Indexing
When you call `.sort([{ col: 'date', dir: 'desc' }])`, Bamboo generates an `number[]` index array representing the sorted order. We never re-order the raw column arrays.

### 3. Materialization
Raw row objects (`T`) are only created when you call "Sink" operations:
- `.toRows()`
- `.toCSV()`
- `.toJSON()`
- `.head()` / `.tail()` (creates a new materialized subset)

---

## 🤝 Relational Operations: Joins

Bamboo implements high-performance hash-joins. When joining `DataFrame<T>` and `DataFrame<U>`:

1. A hash map is built from the join key of the right-side DataFrame.
2. The left-side DataFrame is iterated once, probing the hash map for matches.
3. The resulting types are automatically computed (e.g., a `left` join will automatically make all columns from the right-side nullable in the resulting type).

---

## 🚀 Future Roadmap

While Bamboo is already production-ready, we have big plans for the future:

- [ ] **Vectorized Operations**: Direct manipulation of TypedArrays (Float64Array, etc.) for math-heavy workloads.
- [ ] **Arrow Integration**: Direct support for Apache Arrow buffers for zero-copy IPC.
- [ ] **Pivoting & Reshaping**: Advanced `pivot` and `melt` operations.
- [ ] **Lazy Window Functions**: More expressive syntax for rolling averages and cumulative sums.

---

> 🎋 **Bamboo**: The slim, fast, and safe way to handle data in TypeScript.
