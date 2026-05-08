# Todo App — Implementation Plan

## App Description

A real-time todo app where users can create, complete, and delete tasks. All state is persisted in Postgres and synced to the client via Electric SQL shapes, giving instant optimistic updates with no manual refetching.

---

## User Flows

1. User lands on `/` and sees the full todo list (synced via Electric).
2. User types text in the input and presses Enter or clicks "Add" — new todo appears immediately (optimistic) and persists to Postgres.
3. User clicks the checkbox on any todo to toggle its `completed` state — updates optimistically and syncs back.
4. User clicks the delete button on any todo — removed optimistically, deleted from Postgres.
5. User clicks a filter tab (All / Active / Completed) — list filters client-side without a round-trip.
6. A counter at the bottom shows how many items are left active.

---

## Architecture Provisioning Commands

Run these in order from the project root after the scaffold is in place:

```bash
# 1. Generate the Drizzle migration from the schema
pnpm exec drizzle-kit generate
```

```bash
# 2. Apply the migration (runs via drizzle-kit push or the project migrate script)
pnpm exec drizzle-kit migrate
```

No additional packages needed — `@electric-sql/client`, `@tanstack/db`, and `@tanstack/react-db` are already in the scaffold.

---

## Data Model

Replace the contents of `src/db/schema.ts` with:

```ts
import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core"

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
```

**REPLICA IDENTITY:** The migration SQL must also include:

```sql
ALTER TABLE todos REPLICA IDENTITY FULL;
```

Add this as a raw statement inside the generated migration file under `drizzle/` before running `drizzle-kit migrate`.

---

## Zod Schemas

Update `src/db/zod-schemas.ts`:

```ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { todos } from "./schema"

export const insertTodoSchema = createInsertSchema(todos)
export const selectTodoSchema = createSelectSchema(todos)
```

---

## API Routes

### `src/routes/api/todos.ts` — Electric shape proxy (GET)

- **Method:** GET
- **Purpose:** Proxy Electric shape requests for the `todos` table; injects `ELECTRIC_SOURCE_ID` and `ELECTRIC_SECRET` server-side.
- **Implementation:** Use `electricProxy` from `src/lib/electric-proxy.ts`.

```ts
import { createAPIFileRoute } from "@tanstack/react-start/api"
import { electricProxy } from "../../lib/electric-proxy"

export const Route = createAPIFileRoute("/api/todos")({
  GET: electricProxy("todos"),
})
```

### `src/routes/api/todos/index.ts` — CRUD mutations (POST)

- **Method:** POST
- **Body:** `{ text: string }`
- **Response:** `{ id: string, txid: number }`
- **Tables:** `todos`

```ts
import { createAPIFileRoute } from "@tanstack/react-start/api"
import { db } from "../../../db"
import { todos } from "../../../db/schema"
import { sql } from "drizzle-orm"

export const Route = createAPIFileRoute("/api/todos/")({
  POST: async ({ request }) => {
    const body = await request.json()
    const result = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(todos)
        .values({ id: crypto.randomUUID(), text: body.text })
        .returning()
      const [{ txid }] = await tx.execute<{ txid: string }>(
        sql`SELECT pg_current_xact_id()::xid::text AS txid`
      )
      return { id: row.id, txid: parseInt(txid) }
    })
    return Response.json(result)
  },
})
```

### `src/routes/api/todos/$id.ts` — Update & Delete

- **PUT** `{ completed: boolean }` → `{ id, txid }`  (toggle completed)
- **DELETE** → `{ id, txid }` (remove todo)
- **Tables:** `todos`

```ts
import { createAPIFileRoute } from "@tanstack/react-start/api"
import { db } from "../../../db"
import { todos } from "../../../db/schema"
import { eq, sql } from "drizzle-orm"

export const Route = createAPIFileRoute("/api/todos/$id")({
  PUT: async ({ request, params }) => {
    const body = await request.json()
    const result = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(todos)
        .set({ completed: body.completed })
        .where(eq(todos.id, params.id))
        .returning()
      const [{ txid }] = await tx.execute<{ txid: string }>(
        sql`SELECT pg_current_xact_id()::xid::text AS txid`
      )
      return { id: row.id, txid: parseInt(txid) }
    })
    return Response.json(result)
  },

  DELETE: async ({ params }) => {
    const result = await db.transaction(async (tx) => {
      await tx.delete(todos).where(eq(todos.id, params.id))
      const [{ txid }] = await tx.execute<{ txid: string }>(
        sql`SELECT pg_current_xact_id()::xid::text AS txid`
      )
      return { id: params.id, txid: parseInt(txid) }
    })
    return Response.json(result)
  },
})
```

---

## Electric Collection

Create `src/db/collections/todos.ts`:

```ts
import { createCollection } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { z } from "zod/v4"
import { absoluteApiUrl } from "../../lib/client-url"

const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  createdAt: z.coerce.date(),
})

export type Todo = z.infer<typeof todoSchema>

export const todoCollection = createCollection(
  electricCollectionOptions({
    id: "todos",
    schema: todoSchema,
    getKey: (row) => row.id,
    shapeOptions: {
      url: absoluteApiUrl("/api/todos"),
      parser: {
        timestamptz: (v: string) => new Date(v),
      },
    },
    onInsert: async ({ transaction }) => {
      const todo = transaction.mutations[0].modified
      const res = await fetch(absoluteApiUrl("/api/todos/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: todo.text }),
      })
      const { txid } = await res.json()
      return { txid }
    },
    onUpdate: async ({ transaction }) => {
      const todo = transaction.mutations[0].modified
      const res = await fetch(absoluteApiUrl(`/api/todos/${todo.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: todo.completed }),
      })
      const { txid } = await res.json()
      return { txid }
    },
    onDelete: async ({ transaction }) => {
      const todo = transaction.mutations[0].original
      const res = await fetch(absoluteApiUrl(`/api/todos/${todo.id}`), {
        method: "DELETE",
      })
      const { txid } = await res.json()
      return { txid }
    },
  })
)
```

---

## UI Structure

### `src/routes/index.tsx` — Main todo page

- **SSR:** `ssr: false` (uses `useLiveQuery`)
- **Reads:** `todoCollection`
- **Renders:**
  - `<TodoInput />` — text input + Add button
  - `<FilterTabs />` — All / Active / Completed tabs (local state)
  - `<TodoList />` — filtered list of `<TodoItem />` components
  - Footer with active item count

### Components (inline in `src/routes/index.tsx` or split into `src/components/`):

**TodoInput** — controlled `<input>` with Enter key + button submit. Calls `todoCollection.insert({ id: crypto.randomUUID(), text, completed: false, createdAt: new Date() })`.

**TodoItem** — a `<div>` row containing:
- `<input type="checkbox">` to toggle `completed` via `todoCollection.update(...)`
- `<span>` with the todo text (strike-through when completed via Tailwind `line-through`)
- `<button>` delete icon that calls `todoCollection.delete(...)` with `e.stopPropagation()`

**FilterTabs** — three buttons driving a `filter` state: `'all' | 'active' | 'completed'`

**Live query pattern:**

```tsx
import { useLiveQuery } from "@tanstack/react-db"
import { eq } from "@tanstack/db"
import { todoCollection } from "../db/collections/todos"

// All todos, sorted newest-first
const { data: todos = [] } = useLiveQuery(
  (q) => q.from({ todo: todoCollection }).orderBy(({ todo }) => todo.createdAt, "desc")
)

// Filtered (example for 'active'):
const { data: activeTodos = [] } = useLiveQuery(
  (q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, false))
      .orderBy(({ todo }) => todo.createdAt, "desc")
)
```

---

## Implementation Phases

### Phase 1 — Schema & Migration
1. Write `todos` table in `src/db/schema.ts` (as shown above).
2. Update `src/db/zod-schemas.ts`.
3. Run `pnpm exec drizzle-kit generate` to create the migration file.
4. Add `ALTER TABLE todos REPLICA IDENTITY FULL;` to the generated migration SQL.
5. Run `pnpm exec drizzle-kit migrate` to apply.

### Phase 2 — API Routes
1. Create `src/routes/api/todos.ts` (Electric proxy GET).
2. Create `src/routes/api/todos/index.ts` (POST).
3. Create `src/routes/api/todos/$id.ts` (PUT + DELETE).

### Phase 3 — Electric Collection
1. Create `src/db/collections/todos.ts` with `todoCollection` as shown above.

### Phase 4 — UI
1. Replace `src/routes/index.tsx` with the full todo UI:
   - Set `ssr: false` on the route options.
   - Implement `TodoInput`, `FilterTabs`, `TodoList`, `TodoItem` inline or as separate component files.
   - Use Tailwind + Radix Themes for styling (clean, minimal, dark-mode-friendly).
   - Show active count footer: `{todos.filter(t => !t.completed).length} items left`.

### Phase 5 — Build & Verify
1. Run `pnpm build` and confirm no TypeScript or Vite errors.
2. Run `pnpm dev` and manually verify:
   - Adding a todo appears immediately.
   - Toggling completed strikes through the text.
   - Deleting removes the item.
   - Filter tabs correctly show subsets.
   - No console errors.

### Phase 6 — Tests
1. Add Vitest unit tests in `tests/` covering:
   - `generateValidRow` for the `todos` table using `schema-test-utils.ts`.
   - API route handler logic (mock `db` transactions).

### Phase 7 — README
1. Update `README.md` with: what the app does, how to run locally, required env vars (`DATABASE_URL`, `ELECTRIC_SOURCE_ID`, `ELECTRIC_SECRET`).

---

## Key Constraints (do not violate)

- All `useLiveQuery` calls must be in components inside a route with `ssr: false`.
- `useLiveQuery` returns `{ data }` — never destructure as an array directly.
- Use `eq()` from `@tanstack/db` in `.where()` — never `===`.
- `TodoItem` must NOT nest `<button>` inside another interactive element — use `<div>` rows.
- Every API mutation must return `txid` from `pg_current_xact_id()` in the same transaction.
- The Electric proxy route (`GET /api/todos`) must use `electricProxy` from `src/lib/electric-proxy.ts` to keep secrets server-side.
