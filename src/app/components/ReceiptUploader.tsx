'use client'

import React, { useState, useRef, useEffect } from 'react'
import imageCompression from 'browser-image-compression'

interface ReceiptUploaderProps {
  name: string
  id?: string
  required?: boolean
}

export function ReceiptUploader({ name, id, required = false }: ReceiptUploaderProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  
  const [fileState, setFileState] = useState<{
    originalFile: File | null
    compressedFile: File | null
    isCompressing: boolean
    previewUrl: string | null
    error: string | null
  }>({
    originalFile: null,
    compressedFile: null,
    isCompressing: false,
    previewUrl: null,
    error: null,
  })

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (fileState.previewUrl) {
        URL.revokeObjectURL(fileState.previewUrl)
      }
    }
  }, [fileState.previewUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (!file) {
      setFileState({
        originalFile: null,
        compressedFile: null,
        isCompressing: false,
        previewUrl: null,
        error: null,
      })
      if (hiddenInputRef.current) hiddenInputRef.current.value = ''
      return
    }

    // Set preview URL for images immediately (or PDF generic preview)
    const newPreviewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null

    setFileState(prev => ({
      ...prev,
      originalFile: file,
      compressedFile: null,
      isCompressing: file.type.startsWith('image/') && file.size > 500 * 1024,
      previewUrl: newPreviewUrl,
      error: null,
    }))

    let finalFile = file

    try {
      // PDF or small images are bypassed
      if (file.type.startsWith('image/') && file.size > 500 * 1024) {
        const options = {
          maxSizeMB: 1, // Will compress to try fitting 1MB, but often much smaller
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8,
        }
        
        finalFile = await imageCompression(file, options)
      }
      
      // Update hidden input with the final file so standard FormData submission works
      const dataTransfer = new DataTransfer()
      // We must rename the File if we want to ensure it has the same name, but imageCompression usually handles it.
      // We'll wrap it in a new File just to be 100% sure the name and type are intact.
      const safeFile = new File([finalFile], file.name, { type: finalFile.type })
      dataTransfer.items.add(safeFile)
      
      if (hiddenInputRef.current) {
        hiddenInputRef.current.files = dataTransfer.files
      }

      setFileState(prev => ({
        ...prev,
        compressedFile: finalFile,
        isCompressing: false,
      }))
    } catch (err: any) {
      console.error('Compression error:', err)
      setFileState(prev => ({
        ...prev,
        isCompressing: false,
        error: 'Gagal memproses gambar: ' + err.message,
      }))
      if (hiddenInputRef.current) hiddenInputRef.current.value = ''
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full space-y-3">
      {/* Hidden input actually holds the final file for standard form submission */}
      <input
        type="file"
        name={name}
        id={id}
        ref={hiddenInputRef}
        required={required && !fileState.compressedFile && !fileState.originalFile}
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
      />
      
      {/* Visible generic input for UI interactions */}
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleFileChange}
        className="block w-full text-sm text-slate-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100 border border-slate-300 rounded-md bg-white cursor-pointer"
      />
      <p className="text-xs text-slate-500">Format: JPG, PNG, PDF. Optimal untuk HP.</p>

      {fileState.error && (
        <p className="text-xs text-red-500 font-medium">{fileState.error}</p>
      )}

      {/* Info panel */}
      {fileState.originalFile && !fileState.error && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-sm">
          <div className="flex items-start gap-3">
            {/* Preview Thumbnail */}
            {fileState.previewUrl ? (
              <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden border border-slate-300 bg-slate-100">
                <img src={fileState.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex-shrink-0 w-16 h-16 rounded border border-slate-300 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-medium">
                {fileState.originalFile.type === 'application/pdf' ? 'PDF' : 'DOC'}
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate" title={fileState.originalFile.name}>
                {fileState.originalFile.name}
              </p>
              
              {fileState.isCompressing ? (
                <div className="mt-2 flex items-center text-blue-600">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs font-medium">Mengoptimalkan gambar...</span>
                </div>
              ) : (
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">Asli:</span>
                    <span className={fileState.compressedFile && fileState.compressedFile.size < fileState.originalFile.size ? "line-through text-slate-400" : ""}>
                      {formatSize(fileState.originalFile.size)}
                    </span>
                  </div>
                  
                  {fileState.compressedFile && fileState.compressedFile.size < fileState.originalFile.size && (
                    <div className="flex items-center gap-1 font-medium text-emerald-600">
                      <span>→</span>
                      <span>Akhir: {formatSize(fileState.compressedFile.size)}</span>
                      <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 rounded text-[10px]">
                        -{(100 - (fileState.compressedFile.size / fileState.originalFile.size) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  
                  {fileState.originalFile.type.startsWith('image/') && fileState.originalFile.size <= 500 * 1024 && (
                    <span className="text-slate-500 italic mt-1 sm:mt-0">(Gambar ringan, kompresi di-bypass)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
