import { createFileRoute } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { eq } from "@tanstack/db"
import { useState } from "react"
import { todoCollection, type Todo } from "../db/collections/todos"

export const Route = createFileRoute("/")({ ssr: false, component: TodoApp })

type Filter = "all" | "active" | "completed"

function TodoApp() {
  const [filter, setFilter] = useState<Filter>("all")

  const { data: allTodos = [] } = useLiveQuery((q) =>
    q.from({ todo: todoCollection }).orderBy(({ todo }) => todo.createdAt, "desc")
  )

  const { data: activeTodos = [] } = useLiveQuery((q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, false))
      .orderBy(({ todo }) => todo.createdAt, "desc")
  )

  const { data: completedTodos = [] } = useLiveQuery((q) =>
    q
      .from({ todo: todoCollection })
      .where(({ todo }) => eq(todo.completed, true))
      .orderBy(({ todo }) => todo.createdAt, "desc")
  )

  const displayed =
    filter === "all" ? allTodos : filter === "active" ? activeTodos : completedTodos
  const activeCount = activeTodos.length

  return (
    <div className="flex min-h-svh flex-col items-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-4xl font-light tracking-widest text-gray-800 dark:text-gray-100">
          todos
        </h1>
        <div className="overflow-hidden rounded-lg shadow-lg">
          <TodoInput />
          {allTodos.length > 0 && (
            <>
              <ul className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {displayed.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </ul>
              <div className="flex items-center justify-between bg-white px-4 py-2 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <span>{activeCount} item{activeCount !== 1 ? "s" : ""} left</span>
                <FilterTabs filter={filter} setFilter={setFilter} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TodoInput() {
  const [text, setText] = useState("")

  function submit() {
    const trimmed = text.trim()
    if (!trimmed) return
    todoCollection.insert({ id: crypto.randomUUID(), text: trimmed, completed: false, createdAt: new Date() })
    setText("")
  }

  return (
    <div className="flex items-center border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <input
        type="text"
        className="flex-1 bg-transparent px-4 py-3 text-gray-700 placeholder-gray-400 outline-none dark:text-gray-200"
        placeholder="What needs to be done?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button
        className="px-4 py-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        onClick={submit}
      >
        Add
      </button>
    </div>
  )
}

function TodoItem({ todo }: { todo: Todo }) {
  function toggle() {
    todoCollection.update(todo.id, (draft) => {
      draft.completed = !todo.completed
    })
  }

  function remove(e: React.MouseEvent) {
    e.stopPropagation()
    todoCollection.delete(todo.id)
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={toggle}
        className="h-5 w-5 cursor-pointer accent-green-500"
      />
      <span
        className={`flex-1 text-gray-700 dark:text-gray-200 ${todo.completed ? "line-through text-gray-400 dark:text-gray-500" : ""}`}
      >
        {todo.text}
      </span>
      <button
        onClick={remove}
        className="text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400"
        aria-label="Delete todo"
      >
        ✕
      </button>
    </div>
  )
}

function FilterTabs({ filter, setFilter }: { filter: Filter; setFilter: (f: Filter) => void }) {
  const tabs: Filter[] = ["all", "active", "completed"]
  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setFilter(tab)}
          className={`rounded px-2 py-0.5 capitalize ${
            filter === tab
              ? "border border-red-300 text-red-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
