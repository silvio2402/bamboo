/**
 * World development analysis using the Gapminder dataset.
 * Source: https://github.com/resbaz/r-novice-gapminder-files (CC BY)
 * 1,704 rows · 142 countries · 1952–2007 in 5-year increments
 *
 * Run (Bun):  bun examples/gapminder.ts
 * Run (Node): node --experimental-strip-types examples/gapminder.ts
 */

import { readFileSync } from "node:fs";
import { count, fromCSV, fromRows, mean } from "../src/index";

const text = readFileSync(
  new URL("./data/gapminder.csv", import.meta.url),
  "utf-8",
);

type GapRow = {
  country: string;
  continent: string;
  year: number;
  lifeExp: number;
  pop: number;
  gdpPercap: number;
};

// Parse CSV strings into typed rows with numeric columns
const df = fromRows(
  fromCSV(text)
    .toRows()
    .map(
      (r): GapRow => ({
        country: r.country!,
        continent: r.continent!,
        year: parseInt(r.year!),
        lifeExp: parseFloat(r.lifeExp!),
        pop: parseInt(r.pop!),
        gdpPercap: parseFloat(r.gdpPercap!),
      }),
    ),
);

const year2007 = df.filter((r) => r.year === 2007);

console.log("=== Gapminder World Development (1952–2007) ===");
console.log(
  `Dataset: ${df.size()} observations, ${year2007.size()} countries\n`,
);

// ── 1. Life expectancy by continent in 2007 ─────────────────────────────────
const lifeByContinent = year2007
  .groupBy("continent")
  .aggregate({ avgLifeExp: mean("lifeExp"), countries: count() })
  .sort([{ col: "avgLifeExp", dir: "desc" }]);

console.log("Life expectancy by continent (2007):");
for (const row of lifeByContinent.toRows()) {
  const bar = "█".repeat(Math.round(row.avgLifeExp / 4));
  console.log(
    `  ${String(row.continent).padEnd(10)} ${row.avgLifeExp.toFixed(1).padStart(5)} yrs  ${bar}`,
  );
}

// ── 2. Most populous countries in 2007 ──────────────────────────────────────
console.log("\nTop 10 most populous countries (2007):");
const top10pop = year2007
  .sort([{ col: "pop", dir: "desc" }])
  .head(10)
  .select(["country", "pop", "lifeExp"]);

for (const row of top10pop.toRows()) {
  const popM = (row.pop / 1e6).toFixed(0);
  console.log(
    `  ${String(row.country).padEnd(22)} ${popM.padStart(5)}M  life exp: ${row.lifeExp} yrs`,
  );
}

// ── 3. Biggest economies by total GDP (pop × gdpPercap) ─────────────────────
console.log("\nTop 10 economies by total GDP (2007):");
const top10gdp = year2007
  .derive({ totalGDP_bn: (r) => Math.round((r.pop * r.gdpPercap) / 1e9) })
  .sort([{ col: "totalGDP_bn", dir: "desc" }])
  .head(10)
  .select(["country", "gdpPercap", "totalGDP_bn"]);

for (const row of top10gdp.toRows()) {
  console.log(
    `  ${String(row.country).padEnd(22)} GDP/cap: $${(row.gdpPercap as number).toFixed(0).padStart(7)}  Total: $${row.totalGDP_bn}B`,
  );
}

// ── 4. Life expectancy improvement per continent (1952 → 2007) ──────────────
const contLE = (year: number) =>
  df
    .filter((r) => r.year === year)
    .groupBy("continent")
    .aggregate({ lifeExp: mean("lifeExp") });

const le1952 = new Map(
  contLE(1952)
    .toRows()
    .map((r) => [r.continent, r.lifeExp]),
);
const le2007rows = contLE(2007)
  .sort([{ col: "lifeExp", dir: "desc" }])
  .toRows();

console.log("\nLife expectancy improvement by continent (1952 → 2007):");
for (const row of le2007rows) {
  const was = le1952.get(row.continent as string)!;
  const now = row.lifeExp as number;
  console.log(
    `  ${String(row.continent).padEnd(10)} ${was.toFixed(1)} → ${now.toFixed(1)} yrs  (+${(now - was).toFixed(1)})`,
  );
}
