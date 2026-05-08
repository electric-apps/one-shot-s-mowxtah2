import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { todos } from "./schema"

export const insertTodoSchema = createInsertSchema(todos)
export const selectTodoSchema = createSelectSchema(todos)
