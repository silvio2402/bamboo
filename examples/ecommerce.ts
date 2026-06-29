/**
 * Multi-table e-commerce sales pipeline using synthetic inline data.
 * Demonstrates: fromRows, concat, fillNull, join, derive, groupBy+aggregate, toJSON.
 *
 * Run (Bun):  bun examples/ecommerce.ts
 * Run (Node): node --experimental-strip-types examples/ecommerce.ts
 */

import { count, fromRows, mean, sum } from "../src/index";

type Product = {
  productId: string;
  name: string;
  category: string;
  unitPrice: number;
};

type Order = {
  orderId: string;
  productId: string;
  customerId: string;
  quantity: number;
  discountPct: number | null;
  month: string;
};

// ── Catalog ──────────────────────────────────────────────────────────────────
const products = fromRows<Product>([
  {
    productId: "P001",
    name: "Wireless Keyboard",
    category: "Electronics",
    unitPrice: 79.99,
  },
  {
    productId: "P002",
    name: "USB-C Hub",
    category: "Electronics",
    unitPrice: 49.99,
  },
  {
    productId: "P003",
    name: "Standing Desk Mat",
    category: "Office",
    unitPrice: 34.99,
  },
  {
    productId: "P004",
    name: "Monitor Arm",
    category: "Office",
    unitPrice: 89.99,
  },
  {
    productId: "P005",
    name: "Blue Light Glasses",
    category: "Accessories",
    unitPrice: 24.99,
  },
  {
    productId: "P006",
    name: "Webcam HD",
    category: "Electronics",
    unitPrice: 69.99,
  },
]);

// ── Two months of orders ─────────────────────────────────────────────────────
const ordersJan = fromRows<Order>([
  {
    orderId: "J001",
    productId: "P001",
    customerId: "C1",
    quantity: 2,
    discountPct: 10,
    month: "2024-01",
  },
  {
    orderId: "J002",
    productId: "P002",
    customerId: "C2",
    quantity: 3,
    discountPct: null,
    month: "2024-01",
  },
  {
    orderId: "J003",
    productId: "P003",
    customerId: "C1",
    quantity: 1,
    discountPct: 5,
    month: "2024-01",
  },
  {
    orderId: "J004",
    productId: "P004",
    customerId: "C3",
    quantity: 2,
    discountPct: null,
    month: "2024-01",
  },
  {
    orderId: "J005",
    productId: "P006",
    customerId: "C2",
    quantity: 1,
    discountPct: 15,
    month: "2024-01",
  },
]);

const ordersFeb = fromRows<Order>([
  {
    orderId: "F001",
    productId: "P001",
    customerId: "C3",
    quantity: 1,
    discountPct: null,
    month: "2024-02",
  },
  {
    orderId: "F002",
    productId: "P005",
    customerId: "C1",
    quantity: 4,
    discountPct: 20,
    month: "2024-02",
  },
  {
    orderId: "F003",
    productId: "P002",
    customerId: "C4",
    quantity: 2,
    discountPct: null,
    month: "2024-02",
  },
  {
    orderId: "F004",
    productId: "P004",
    customerId: "C2",
    quantity: 1,
    discountPct: 10,
    month: "2024-02",
  },
  {
    orderId: "F005",
    productId: "P006",
    customerId: "C4",
    quantity: 3,
    discountPct: 5,
    month: "2024-02",
  },
]);

console.log("=== E-Commerce Sales Pipeline ===\n");

// Merge two monthly batches, fill missing discounts with 0
const orders = ordersJan.concat(ordersFeb).fillNull({ discountPct: 0 });
console.log(`Orders loaded: ${orders.size()} across 2 months`);

// Join each order line with the product catalog
const enriched = orders.join(products, { on: "productId" });

// Compute line-item revenue: quantity × unit price × (1 - discount%)
const withRevenue = enriched.derive({
  revenue: (r) =>
    Math.round(
      r.quantity * r.unitPrice * (1 - (r.discountPct as number) / 100) * 100,
    ) / 100,
});

// ── Revenue by category ───────────────────────────────────────────────────────
const byCategory = withRevenue
  .groupBy("category")
  .aggregate({
    revenue: sum("revenue"),
    orders: count(),
    avgOrder: mean("revenue"),
  })
  .sort([{ col: "revenue", dir: "desc" }]);

console.log("\nRevenue by category:");
for (const row of byCategory.toRows()) {
  console.log(
    `  ${String(row.category).padEnd(14)}` +
      `  $${(row.revenue as number).toFixed(2).padStart(8)}` +
      `  (${row.orders} orders, avg $${(row.avgOrder as number).toFixed(2)})`,
  );
}

// ── Monthly revenue trend ─────────────────────────────────────────────────────
const byMonth = withRevenue
  .groupBy("month")
  .aggregate({ revenue: sum("revenue"), orders: count() })
  .sort([{ col: "month", dir: "asc" }]);

console.log("\nMonthly revenue:");
for (const row of byMonth.toRows()) {
  const bar = "█".repeat(Math.round((row.revenue as number) / 30));
  console.log(
    `  ${row.month}  $${(row.revenue as number).toFixed(2).padStart(8)}  (${row.orders} orders)  ${bar}`,
  );
}

// ── Top products ──────────────────────────────────────────────────────────────
const byProduct = withRevenue
  .groupBy("name")
  .aggregate({ revenue: sum("revenue"), unitsSold: sum("quantity") })
  .sort([{ col: "revenue", dir: "desc" }]);

console.log("\nTop products by revenue:");
for (const row of byProduct.toRows()) {
  console.log(
    `  ${String(row.name).padEnd(22)}  $${(row.revenue as number).toFixed(2).padStart(8)}  (${row.unitsSold} units)`,
  );
}

// ── Export summary as JSON ────────────────────────────────────────────────────
console.log("\nCategory revenue (JSON):");
console.log(byCategory.select(["category", "revenue", "orders"]).toJSON());
