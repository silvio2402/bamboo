/**
 * US temperature trends with rolling averages, using the CORGIS weather dataset.
 * Source: https://corgis-edu.github.io/corgis/datasets/csv/weather/ (NOAA public domain)
 * ~16,700 rows · weekly readings · ~200 US cities · 2016
 *
 * Run: bun examples/weather.ts
 */

import { fromCSV, fromRows, max, mean, min, sum } from "../src/index";

const text = await Bun.file(
  new URL("./data/weather.csv", import.meta.url),
).text();

type WeatherRow = {
  city: string;
  state: string;
  date: string;
  month: number;
  precipitation: number;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  windSpeed: number;
};

// Rename dotted CSV column names to clean identifiers
const df = fromRows(
  fromCSV(text)
    .toRows()
    .map(
      (r): WeatherRow => ({
        city: r["Station.City"],
        state: r["Station.State"],
        date: r["Date.Full"],
        month: parseInt(r["Date.Month"]),
        precipitation: parseFloat(r["Data.Precipitation"]),
        avgTemp: parseFloat(r["Data.Temperature.Avg Temp"]),
        maxTemp: parseFloat(r["Data.Temperature.Max Temp"]),
        minTemp: parseFloat(r["Data.Temperature.Min Temp"]),
        windSpeed: parseFloat(r["Data.Wind.Speed"]),
      }),
    ),
);

const MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

console.log("=== US Weather Analysis 2016 ===");
console.log(
  `Dataset: ${df.size()} weekly readings across ${df.distinct(["city"]).size()} cities\n`,
);

// ── 1. Seattle's weekly temperatures with 4-week rolling average ─────────────
// The derive window function receives (row, visibleIndex, allVisibleRows),
// making it straightforward to compute rolling statistics across the sorted sequence.
const seattle = df
  .filter((r) => r.city === "Seattle")
  .sort([{ col: "date", dir: "asc" }])
  .derive({
    rolling4wk: (_, idx, rows) => {
      const window = rows.slice(Math.max(0, idx - 3), idx + 1);
      const avg = window.reduce((s, r) => s + r.avgTemp, 0) / window.length;
      return Math.round(avg * 10) / 10;
    },
  });

console.log("Seattle weekly avg temperature + 4-week rolling average:");
for (const row of seattle.toRows()) {
  const bar = "█".repeat(Math.max(0, Math.round((row.avgTemp as number) / 5)));
  console.log(
    `  ${row.date}  ${String(row.avgTemp).padStart(3)}°F  4wk: ${String(row.rolling4wk).padStart(5)}°F  ${bar}`,
  );
}

// ── 2. National monthly temperature summary ──────────────────────────────────
const monthly = df
  .groupBy("month")
  .aggregate({
    avgTemp: mean("avgTemp"),
    minTemp: min("minTemp"),
    maxTemp: max("maxTemp"),
    totalPrecip: sum("precipitation"),
  })
  .sort([{ col: "month", dir: "asc" }]);

console.log("\nNational monthly summary (all cities, 2016):");
for (const row of monthly.toRows()) {
  const name = MONTHS[row.month as number] ?? "???";
  console.log(
    `  ${name}  avg: ${(row.avgTemp as number).toFixed(1).padStart(5)}°F` +
      `  range: ${row.minTemp}–${row.maxTemp}°F` +
      `  precip: ${(row.totalPrecip as number).toFixed(1)}"`,
  );
}

// ── 3. Hottest and coldest cities by annual average ──────────────────────────
const cityTemps = df
  .groupBy(["city", "state"])
  .aggregate({ avgTemp: mean("avgTemp") })
  .sort([{ col: "avgTemp", dir: "desc" }]);

console.log("\nTop 5 hottest cities (annual avg):");
for (const row of cityTemps.head(5).toRows()) {
  console.log(
    `  ${String(row.city).padEnd(18)} ${String(row.state).padEnd(15)} ${(row.avgTemp as number).toFixed(1)}°F`,
  );
}

console.log("\nTop 5 coldest cities (annual avg):");
for (const row of cityTemps.tail(5).toRows()) {
  console.log(
    `  ${String(row.city).padEnd(18)} ${String(row.state).padEnd(15)} ${(row.avgTemp as number).toFixed(1)}°F`,
  );
}
