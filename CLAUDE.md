
Supports both Bun and Node.js.

- Use `bun <file>` or `node --experimental-strip-types <file>` (Node 22+) / `tsx <file>`
- Use `bun test` or `node --test` (Node 20+)
- Use `bun install` or `npm install`
- Bun automatically loads .env, for Node use `--env-file=.env` (Node 20.6+)
- Prefer standard Node.js APIs (e.g., `node:fs`, `node:path`) for broader compatibility in library code and examples.

## APIs

- `Bun.serve()` is great for Bun-only apps, but for cross-runtime use standard `Request`/`Response` handlers.
- Prefer `node:fs` `readFileSync`/`writeFileSync` over `Bun.file` in examples to avoid IDE errors for non-Bun users.
- `bun:sqlite` for SQLite in Bun, `better-sqlite3` for Node.
- `WebSocket` is built-in in Bun and newer Node.
- `Bun.$` is Bun-specific; use `node:child_process` or `execa` for cross-runtime scripts.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.
