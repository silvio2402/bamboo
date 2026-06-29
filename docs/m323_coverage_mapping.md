# Module 323 (Functional Programming) Concept Coverage Mapping for Bamboo

This document provides an overview of the concepts covered in **Module 323: Funktional Programmieren** and details how they map to the **Bamboo** data transformation library codebase. It serves as an audit and extension guide to ensure that Bamboo fulfills all requirements of a functional project in a vocational school context.

---

## 📊 M323 Concept Coverage Dashboard

| Chapter / Concept | Syllabus Topic | Coverage Status | Code Reference | Test Reference | Notes / Gaps |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **01 Einführung** | Imperative vs. Declarative | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | API represents *what* to do, hiding performance-optimized *how* |
| | Concept of a Function | ✅ Fully Covered | Throughout | Throughout | All methods are pure and always return a new value |
| | Semantic Verb Naming | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | Throughout | Methods use clear verb forms (`derive`, `select`, `drop`, `rename`) |
| **02 Anforderungen** | Declarative Requirements | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Elegant, declarative method chains rather than nested loops |
| | Deriving Signatures | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Type signatures map inputs to output shapes (e.g., `DeriveResult`) |
| **03 Pure Functions** | Pure Functions | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | No side-effects; input values are preserved entirely |
| | Referential Transparency | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Any pipeline can be replaced by its evaluated DataFrame value |
| | Immutable Values | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Read-only classes; arrays are shallow-copied during modifications |
| | **Recursion** | ❌ Not Covered | N/A | N/A | Internal code uses iterative loops for optimal performance |
| **04 Functions as Values** | HOFs (Functions as Args) | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L216-L221) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | `.filter()`, `.derive()`, `.aggregate()` accept user functions |
| | HOFs (Returning Functions) | ✅ Fully Covered | [aggregators.ts](file:///home/silvio2402/Projects/bamboo/src/aggregators.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Aggregators (`sum(col)`) return a function `(rows) => R` |
| | Anonymous Functions | ✅ Fully Covered | Throughout | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Lambdas are used extensively in filtering, tests, and examples |
| | Functional `map` | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L245-L285) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | `.derive()` maps row objects to computed columns |
| | Functional `filter` | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L216-L221) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | `.filter()` drops rows according to a boolean predicate function |
| | Functional `foldLeft`/`reduce` | ✅ Fully Covered | [aggregators.ts](file:///home/silvio2402/Projects/bamboo/src/aggregators.ts#L1-L6) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Internal aggregations reduce row arrays down to primitive values |
| | **flatMap** | ❌ Not Covered | N/A | N/A | Missing native `.flatMap` method on `DataFrame` itself |
| | Product Types / Case Classes | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L5-L50) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | TypeScript interfaces / typed shapes are product types of rows |
| | Currying | ✅ Fully Covered | [aggregators.ts](file:///home/silvio2402/Projects/bamboo/src/aggregators.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Aggregators (e.g. `sum(col)(rows)`) are curried structures |
| **05 Weitere Datenstrukturen**| Lists (Arrays) | ✅ Fully Covered | Throughout | Throughout | Standard underlying structure of columnar/row-based storage |
| | Sets | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L228-L241) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Used in `.distinct()` and `.drop()` column index operations |
| | Maps | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L385-L437) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Used in `.groupBy()` hash indexing and `.join()` hash tables |
| | Tuples | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L58-L72) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Core typed array structures like `[col, data] as const` are tuples |
| | **Pattern Matching** | ❌ Not Covered | N/A | N/A | Uses TS type-narrowing/conditionals, no FP pattern matching |
| | **Zip** | ❌ Not Covered | N/A | N/A | No method to merge two columns or collections side-by-side |
| | Filter-Map-Reduce | ✅ Fully Covered | Throughout | Throughout | The heart of data pipeline construction |
| **06 Weitere Algorithmen** | Pipelines | ✅ Fully Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Chaining methods natively. No helper functional `pipe(...)` yet. |
| | **IO Encapsulation** | ❌ Not Covered | N/A | N/A | Synchronous pure actions only; no monad to defer side effects |
| | Streams / LazyList | 🟡 Partially Covered | [lazy.ts](file:///home/silvio2402/Projects/bamboo/src/lazy.ts) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Implements simple `Lazy<T>`; no full lazy-evaluated stream |
| | **Parallel / Threads (Ref)** | ❌ Not Covered | N/A | N/A | Single-threaded JS event loop; no shared state atomic wrappers |
| **07 Error Handling** | **Option[A] (Some/None)** | 🟡 Partially Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L20) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Rely on `T \| null` unions instead of algebraic monads |
| | **Either[E, A] (Left/Right)** | ❌ Not Covered | N/A | N/A | Parsing and exceptions do not use functional error monads |
| | orElse | 🟡 Partially Covered | [dataframe.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.ts#L324-L340) | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | Represented via `.fillNull()` and standard JS `??` operators |
| | Functional Testing | ✅ Fully Covered | [dataframe.test.ts](file:///home/silvio2402/Projects/bamboo/src/dataframe.test.ts) | N/A | Clean, isolated, declarative assertions run with `bun test` |

---

## 🔍 In-Depth Analysis of Existing Implementations

### 1. Declarative Programming (Chapter 01 & 02)
Rather than writing procedural nested arrays, indices, and accumulator variables, users of Bamboo specify **what** they want. 

*Example from an e-commerce calculation:*
```typescript
const result = orders
  .filter(r => r.status === "completed")
  .groupBy("category")
  .aggregate({ totalSales: sum("price") });
```
Under the hood, Bamboo handles bitmasks and column arrays, keeping the interface completely declarative.

### 2. Pure Functions & Immutability (Chapter 03)
Bamboo's `DataFrame` is immutable. Every transformation returns a completely new `DataFrame`.
In `src/dataframe.ts`, notice how functions create new arrays or copy existing state instead of modifying values:
```typescript
filter(fn: (row: T) => boolean): DataFrame<T> {
  const newBitmask = this.bitmask.map((active, i) =>
    active ? fn(this.rowAt(i)) : false,
  );
  return new DataFrame(this.storage, newBitmask, [...this.sortIndex]);
}
```
* `bitmask.map` creates a fresh array.
* `[...this.sortIndex]` spreads and copies the sorting indexes.
* A new `DataFrame` instance is instantiated and returned.

### 3. Higher-Order Functions & Currying (Chapter 04)
Aggregators in `src/aggregators.ts` are a textbook example of currying and returning functions:
```typescript
export const sum =
  <U extends Record<string, unknown> = Record<string, unknown>>(
    col: keyof U & string,
  ) =>
  (rows: U[]): number =>
    rows.reduce((acc, r) => acc + ((r[col] as number) ?? 0), 0);
```
Here, `sum("price")` configures the aggregator (returns a function), which is then applied by the grouping aggregator later on.

---

## 🛠️ Actionable Extension Plan to Achieve 100% Coverage

To guarantee that your teacher sees every single M323 topic represented in the `bamboo` library, we can easily add functional monadic utilities and structural enhancements. Below are the concrete designs and implementations we can add to the library.

### 1. Monads for Error Handling: `Option` & `Either` (Chapter 07)
Instead of returning `T | null` or throwing exceptions (which violates pure functions), we can define classic functional containers.

> [!TIP]
> **Recommended implementation (`src/monads.ts`):**
> ```typescript
> // Option Monad
> export type Option<T> = Some<T> | None;
> 
> class Some<T> {
>   readonly tag = "some";
>   constructor(readonly value: T) {}
>   map<U>(f: (val: T) => U): Option<U> { return new Some(f(this.value)); }
>   flatMap<U>(f: (val: T) => Option<U>): Option<U> { return f(this.value); }
>   getOrElse(def: T): T { return this.value; }
> }
> 
> class None {
>   readonly tag = "none";
>   map<U>(f: (val: unknown) => U): Option<U> { return this as unknown as Option<U>; }
>   flatMap<U>(f: (val: unknown) => Option<U>): Option<U> { return this as unknown as Option<U>; }
>   getOrElse<T>(def: T): T { return def; }
> }
> 
> export const some = <T>(v: T): Option<T> => new Some(v);
> export const none = (): Option<never> => new None() as Option<never>;
> 
> // Either Monad (Success/Failure)
> export type Either<L, R> = Left<L> | Right<R>;
> 
> class Left<L> {
>   readonly tag = "left";
>   constructor(readonly value: L) {}
>   map<U>(f: (val: never) => U): Either<L, U> { return this as unknown as Either<L, U>; }
>   flatMap<U>(f: (val: never) => Either<L, U>): Either<L, U> { return this as unknown as Either<L, U>; }
> }
> 
> class Right<R> {
>   readonly tag = "right";
>   constructor(readonly value: R) {}
>   map<U>(f: (val: R) => U): Either<never, U> { return new Right(f(this.value)) as unknown as Either<never, U>; }
>   flatMap<L, U>(f: (val: R) => Either<L, U>): Either<L, U> { return f(this.value); }
> }
> 
> export const left = <L>(v: L): Either<L, never> => new Left(v);
> export const right = <R>(v: R): Either<never, R> => new Right(v);
> ```

We can then use `Either` to parse CSVs functionally in `fromCSV`: returning `Right(DataFrame)` on success or `Left(ParseError)` if headers/structure are corrupted.

---

### 2. Recursion & Pattern Matching (Chapter 03 & 05)
To show functional recursion and structural matching in TypeScript:

> [!TIP]
> **Recommended implementation (`src/matching.ts`):**
> ```typescript
> // Recursive pattern-matching solver for nested arrays / filters
> export type MatchPattern<T, R> = {
>   when: (val: T) => boolean;
>   then: (val: T) => R;
> };
> 
> export function match<T, R>(val: T, patterns: MatchPattern<T, R>[], defaultFn: (val: T) => R): R {
>   // Recursive list parsing
>   function loop(idx: number): R {
>     if (idx >= patterns.length) return defaultFn(val);
>     const pat = patterns[idx]!;
>     if (pat.when(val)) return pat.then(val);
>     return loop(idx + 1); // Tail recursion
>   }
>   return loop(0);
> }
> ```
We can also implement a **recursive filter** or **recursive aggregation** (e.g. running down hierarchically grouped indices).

---

### 3. FlatMap & Zip (Chapter 04 & 05)
Adding `.flatMap` and `.zip` methods directly onto `DataFrame`.

> [!TIP]
> **Recommended implementation in `DataFrame`:**
> ```typescript
> // FlatMap: Maps each row to multiple rows (or another DataFrame) and flattens
> flatMap<U extends Record<string, unknown>>(
>   fn: (row: T) => DataFrame<U> | U[]
> ): DataFrame<U> {
>   const allRows = this.toRows().flatMap(row => {
>     const res = fn(row);
>     return res instanceof DataFrame ? res.toRows() : res;
>   });
>   return fromRows(allRows);
> }
> 
> // Zip: Combines two DataFrames row-by-row into key-value pairs
> zip<U extends Record<string, unknown>>(
>   other: DataFrame<U>
> ): DataFrame<T & U> {
>   const left = this.toRows();
>   const right = other.toRows();
>   const n = Math.min(left.length, right.length);
>   const zippedRows: (T & U)[] = [];
>   for (let i = 0; i < n; i++) {
>     zippedRows.push({ ...left[i]!, ...right[i]! });
>   }
>   return fromRows(zippedRows);
> }
> ```

---

### 4. Pipelines & IO Encapsulation (Chapter 06)
In functional programming, instead of writing nested method calls, we can implement a `pipe` function.
We can also wrap side-effect operations (like loading from a file) in a deferred `IO` container.

> [!TIP]
> **Recommended implementation (`src/io_effects.ts`):**
> ```typescript
> // FP Pipe Utility
> export function pipe<A, B>(a: A, ab: (a: A) => B): B;
> export function pipe<A, B, C>(a: A, ab: (a: A) => B, bc: (b: B) => C): C;
> export function pipe<A, B, C, D>(a: A, ab: (a: A) => B, bc: (b: B) => C, cd: (c: C) => D): D;
> export function pipe(a: unknown, ...fns: Function[]): unknown {
>   return fns.reduce((acc, fn) => fn(acc), a);
> }
> 
> // Simple IO Monad to encapsulate impure operations (like reading files)
> export class IO<A> {
>   constructor(private readonly effect: () => A) {}
> 
>   static delay<A>(fn: () => A): IO<A> {
>     return new IO(fn);
>   }
> 
>   map<B>(f: (a: A) => B): IO<B> {
>     return new IO(() => f(this.effect()));
>   }
> 
>   flatMap<B>(f: (a: A) => IO<B>): IO<B> {
>     return new IO(() => f(this.effect()).runSync());
>   }
> 
>   runSync(): A {
>     return this.effect();
>   }
> }
> ```

---

### 5. Streams / LazyList (Chapter 06)
We can build a proper `LazyList` (or `Stream`) class in `src/stream.ts` to show how infinite/lazy functional streams operate.

> [!TIP]
> **Recommended implementation (`src/stream.ts`):**
> ```typescript
> export class LazyList<T> {
>   private constructor(
>     private readonly headCell: () => T | null,
>     private readonly tailCell: () => LazyList<T> | null
>   ) {}
> 
>   static empty<T>(): LazyList<T> {
>     return new LazyList<T>(() => null, () => null);
>   }
> 
>   static cons<T>(head: T, tail: () => LazyList<T>): LazyList<T> {
>     return new LazyList(() => head, tail);
>   }
> 
>   head(): T | null { return this.headCell(); }
>   tail(): LazyList<T> | null { return this.tailCell(); }
> 
>   take(n: number): T[] {
>     if (n <= 0) return [];
>     const h = this.head();
>     if (h === null) return [];
>     const t = this.tail();
>     return [h, ...(t ? t.take(n - 1) : [])];
>   }
> 
>   map<U>(f: (val: T) => U): LazyList<U> {
>     const h = this.head();
>     if (h === null) return LazyList.empty();
>     return LazyList.cons(f(h), () => this.tail()!.map(f));
>   }
> }
> ```

---

## 🎯 Next Steps

By implementing the above items, your `bamboo` library moves from being a clean tabular utility to a **world-class functional programming sandbox** covering 100% of Module 323 learning objectives.

Do you want to proceed by implementing these missing structures in your codebase? I can create these files and add thorough tests!
