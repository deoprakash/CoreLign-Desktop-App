import React from 'react'
import { useNotification } from '../context/NotificationContext'

export default function ToastContainer() {
  const { toasts, remove } = useNotification()

  return (
    <div aria-live="polite" className="fixed right-6 top-6 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div key={t.id} className={`max-w-sm rounded-lg px-4 py-3 shadow-lg ${t.type === 'error' ? 'bg-rose-600 text-white' : t.type === 'warn' ? 'bg-amber-500 text-white' : 'bg-white text-slate-800'}`} role={t.type === 'error' ? 'alert' : 'status'}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 text-sm leading-tight">{t.title ? <div className="font-semibold">{t.title}</div> : null}{t.message}</div>
            <div>
              <button aria-label="dismiss" onClick={() => remove(t.id)} className="ml-3 text-xs opacity-80">Dismiss</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
