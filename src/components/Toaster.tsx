import * as React from 'react'
import * as Toast from '@radix-ui/react-toast'

interface ToastEntry {
  id: number
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

interface ToastContextValue {
  toast: (entry: Omit<ToastEntry, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

let nextId = 1

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <Toaster />')
  return ctx
}

export function Toaster({ children }: { children?: React.ReactNode } = {}) {
  const [entries, setEntries] = React.useState<ToastEntry[]>([])

  const toast: ToastContextValue['toast'] = React.useCallback((entry) => {
    setEntries((prev) => [...prev, { ...entry, id: nextId++ }])
  }, [])

  const dismiss = React.useCallback((id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right" duration={5000}>
        {children}
        {entries.map((entry) => (
          <Toast.Root
            key={entry.id}
            onOpenChange={(open) => { if (!open) dismiss(entry.id) }}
            style={{
              background: 'var(--theme-bg-elevated)',
              color: 'var(--theme-text-1)',
              border: '1px solid var(--theme-divider)',
              borderRadius: 8,
              padding: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              ...(entry.variant === 'destructive' ? { borderColor: 'var(--theme-error, #dc2626)' } : {}),
            }}
          >
            <Toast.Title style={{ fontWeight: 600 }}>{entry.title}</Toast.Title>
            {entry.description && (
              <Toast.Description style={{ marginTop: 4, color: 'var(--theme-text-2)' }}>
                {entry.description}
              </Toast.Description>
            )}
          </Toast.Root>
        ))}
        <Toast.Viewport
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: 16,
            gap: 8,
            width: 360,
            maxWidth: '100vw',
            zIndex: 2147483647,
          }}
        />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}
