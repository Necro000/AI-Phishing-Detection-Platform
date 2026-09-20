'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'threat' | 'error'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  timestamp: number
  persist?: boolean
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'timestamp'>) => string
  removeToast: (id: string) => void
  threat: (title: string, message?: string) => string
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const TOAST_ICONS: Record<ToastType, string> = {
  threat: '🚨',
  error: '❌',
  warning: '⚠️',
  success: '✅',
  info: 'ℹ️',
}

const TOAST_STYLES: Record<
  ToastType,
  { border: string; bg: string; titleColor: string; badge: string }
> = {
  threat: {
    border: 'border-red-500/50 shadow-red-950/50',
    bg: 'bg-slate-900/95 backdrop-blur-xl',
    titleColor: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  error: {
    border: 'border-rose-500/40 shadow-rose-950/40',
    bg: 'bg-slate-900/95 backdrop-blur-xl',
    titleColor: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  warning: {
    border: 'border-amber-500/40 shadow-amber-950/40',
    bg: 'bg-slate-900/95 backdrop-blur-xl',
    titleColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  success: {
    border: 'border-emerald-500/40 shadow-emerald-950/40',
    bg: 'bg-slate-900/95 backdrop-blur-xl',
    titleColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  info: {
    border: 'border-blue-500/40 shadow-blue-950/40',
    bg: 'bg-slate-900/95 backdrop-blur-xl',
    titleColor: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({
      type,
      title,
      message,
      persist,
    }: Omit<Toast, 'id' | 'timestamp'>): string => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const isHighSeverity = type === 'threat' || type === 'error'
      const shouldPersist = persist ?? isHighSeverity

      const newToast: Toast = {
        id,
        type,
        title,
        message,
        timestamp: Date.now(),
        persist: shouldPersist,
      }

      setToasts((prev) => [newToast, ...prev.slice(0, 5)]) // Limit max 6 visible toasts

      // Tiered auto-dismiss timing
      if (!shouldPersist) {
        const timeoutMs = type === 'warning' ? 7000 : 4500
        setTimeout(() => {
          removeToast(id)
        }, timeoutMs)
      }

      return id
    },
    [removeToast]
  )

  const threat = useCallback(
    (title: string, message?: string) => addToast({ type: 'threat', title, message }),
    [addToast]
  )
  const success = useCallback(
    (title: string, message?: string) => addToast({ type: 'success', title, message }),
    [addToast]
  )
  const error = useCallback(
    (title: string, message?: string) => addToast({ type: 'error', title, message }),
    [addToast]
  )
  const warning = useCallback(
    (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    [addToast]
  )
  const info = useCallback(
    (title: string, message?: string) => addToast({ type: 'info', title, message }),
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, threat, success, error, warning, info }}
    >
      {children}

      {/* Top-Right Toast Viewport */}
      <aside
        aria-label="Notifications"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none sm:max-w-md"
      >
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type]
          const isHighSeverity = toast.type === 'threat' || toast.type === 'error'

          return (
            <div
              key={toast.id}
              role={isHighSeverity ? 'alert' : 'status'}
              aria-live={isHighSeverity ? 'assertive' : 'polite'}
              className={`pointer-events-auto w-full p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5 select-none" aria-hidden="true">
                  {TOAST_ICONS[toast.type]}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-sm font-semibold tracking-tight ${style.titleColor}`}>
                      {toast.title}
                    </span>
                    {toast.persist && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">
                        Action Required
                      </span>
                    )}
                  </div>

                  {toast.message && (
                    <p className="text-xs text-slate-300/90 leading-relaxed break-words font-sans">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </aside>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
