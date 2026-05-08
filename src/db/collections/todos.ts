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
