'use client'

import { useEffect } from 'react'

interface SuccessModalProps {
  isOpen: boolean
  title?: string
  message: string
  onClose: () => void
}

export function SuccessModal({ isOpen, title = 'Berhasil!', message, onClose }: SuccessModalProps) {
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isOpen) {
      // Auto-close after 3 seconds
      timer = setTimeout(() => {
        onClose()
      }, 3000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 mb-6">{message}</p>
          
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
