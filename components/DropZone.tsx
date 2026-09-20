'use client'

import React, { useState, useRef, useCallback } from 'react'
import { parseEmailContent, isOutlookMsgBinary, type ParsedEmailResult } from '@/lib/mimeParser'
import { useToast } from './ToastProvider'

interface DropZoneProps {
  onParsed: (result: { fileName: string; data: ParsedEmailResult }) => void
  disabled?: boolean
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB Hard limit

export function DropZone({ onParsed, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const processFile = useCallback(
    async (file: File) => {
      // 1. File size enforcement
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          'File size limit exceeded',
          `Selected file (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds the 2MB safety threshold.`
        )
        return
      }

      const lowerName = file.name.toLowerCase()

      // 2. Explicit .msg rejection with clear instructions
      if (lowerName.endsWith('.msg')) {
        toast.warning(
          'Unsupported Outlook Binary (.msg)',
          'Outlook .msg is a proprietary binary format. Please drag an .eml file or paste the message text.'
        )
        return
      }

      setIsProcessing(true)

      try {
        // Read header bytes to check for binary OLE signature
        const arrayBuf = await file.arrayBuffer()
        const headerBytes = new Uint8Array(arrayBuf.slice(0, 8))

        if (isOutlookMsgBinary(headerBytes)) {
          toast.warning(
            'Binary file rejected',
            'Detected an OLE compound binary. Please export the email as RFC 822 (.eml) or plain text.'
          )
          setIsProcessing(false)
          return
        }

        // Read text content
        const text = new TextDecoder('utf-8').decode(arrayBuf)
        const parsed = parseEmailContent(text)

        if (parsed.dangerousSchemesBlocked > 0) {
          toast.warning(
            'Malicious Link Schemes Neutralized',
            `Detected and blocked ${parsed.dangerousSchemesBlocked} non-standard URI(s) (e.g. javascript/data).`
          )
        }

        toast.info(
          'Email Ingestion Complete',
          `Parsed ${file.name} (${parsed.extractedUrls.length} link(s) found).`
        )

        onParsed({ fileName: file.name, data: parsed })
      } catch (err) {
        toast.error('File parsing error', err instanceof Error ? err.message : 'Unable to parse file.')
      } finally {
        setIsProcessing(false)
      }
    },
    [toast, onParsed]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload email file for phishing analysis"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      onKeyDown={handleKeyDown}
      className={`relative w-full rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
        isDragging
          ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-xl shadow-cyan-500/20'
          : 'border-white/15 bg-white/[0.02] hover:border-blue-500/50 hover:bg-blue-950/20 shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".eml,.txt"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
          }
        }}
        disabled={disabled}
      />

      <div className="flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-2xl text-blue-400 shadow-inner">
          {isProcessing ? (
            <svg className="animate-spin h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            '📁'
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-200">
            {isDragging ? 'Drop file to inspect' : 'Drop an .eml or .txt email file here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            or <span className="text-blue-400 underline font-medium">browse files</span> from your device (Max 2MB)
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            .eml (RFC 822)
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            .txt
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
            .msg not supported
          </span>
        </div>
      </div>
    </div>
  )
}
