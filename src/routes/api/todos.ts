import { createFileRoute } from "@tanstack/react-router"
import { db } from "../../db"
import { todos } from "../../db/schema"
import { sql } from "drizzle-orm"
import { electricProxy } from "../../lib/electric-proxy"

export const Route = createFileRoute("/api/todos")({
  server: {
    handlers: {
      GET: electricProxy("todos"),
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
    },
  },
})
