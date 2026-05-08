# Todo App

A real-time todo app built with TanStack Start and Electric SQL. Tasks are persisted in Postgres and synced to the client via Electric shapes, giving instant optimistic updates.

## Features

- Add, complete, and delete todos
- Filter by All / Active / Completed
- Instant optimistic updates — no manual refetching
- Real-time sync across browser tabs via Electric SQL

## Running locally

### Prerequisites

- Node.js 20+
- pnpm
- Postgres with `wal_level=logical`
- Electric SQL running locally (or an Electric Cloud account)

### Setup

```bash
pnpm install
```

Copy `.env.example` to `.env` and fill in:

```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
ELECTRIC_SOURCE_ID=<your-source-id>      # Electric Cloud only
ELECTRIC_SECRET=<your-secret>            # Electric Cloud only
ELECTRIC_URL=http://localhost:3000       # Local Electric (default)
```

### Migrate the database

```bash
pnpm exec drizzle-kit migrate
```

### Start the dev server

```bash
pnpm dev
```

Open [http://localhost:5174](http://localhost:5174).

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Postgres connection string |
| `ELECTRIC_SOURCE_ID` | Cloud only | Electric Cloud source ID |
| `ELECTRIC_SECRET` | Cloud only | Electric Cloud auth secret |
| `ELECTRIC_URL` | No | Electric URL (default: `http://localhost:3000`) |

## Running tests

```bash
pnpm test
```
