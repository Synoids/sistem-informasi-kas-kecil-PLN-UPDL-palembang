'use client'

import { useState, useEffect } from 'react'

type ToastType = 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
}

let showToastFn: ((message: string, type: ToastType) => void) | null = null

export function showToast(message: string, type: ToastType = 'success') {
  showToastFn?.(message, type)
}

export function ToastProvider() {
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    showToastFn = (message, type) => {
      setToast({ message, type })
      setTimeout(() => setToast(null), 4000)
    }
    return () => { showToastFn = null }
  }, [])

  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-toast">
      <div
        className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}
      >
        {toast.message}
      </div>
    </div>
  )
}
