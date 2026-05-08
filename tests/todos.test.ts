import { describe, it, expect } from "vitest"
import { generateValidRow, generateRowWithout } from "./helpers/schema-test-utils"
import { selectTodoSchema, insertTodoSchema } from "../src/db/zod-schemas"

describe("todos schema validation", () => {
  it("generates a valid todo row that passes selectTodoSchema", () => {
    const row = generateValidRow(selectTodoSchema)
    const result = selectTodoSchema.safeParse(row)
    expect(result.success).toBe(true)
  })

  it("generates a valid insert row that passes insertTodoSchema", () => {
    const row = generateValidRow(insertTodoSchema)
    const result = insertTodoSchema.safeParse(row)
    expect(result.success).toBe(true)
  })

  it("rejects a row missing the required text field", () => {
    const row = generateRowWithout(selectTodoSchema, "text")
    const result = selectTodoSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it("rejects a row missing the required id field", () => {
    const row = generateRowWithout(selectTodoSchema, "id")
    const result = selectTodoSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it("rejects a row missing the required completed field", () => {
    const row = generateRowWithout(selectTodoSchema, "completed")
    const result = selectTodoSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it("completed defaults to false in insert schema", () => {
    const row = generateValidRow(insertTodoSchema)
    // completed should be a boolean
    expect(typeof row.completed).toBe("boolean")
  })
})
