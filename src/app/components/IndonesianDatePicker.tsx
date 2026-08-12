'use client'

import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import { id } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'

// IMPORTANT: Do NOT use toISOString() to avoid timezone shift.
export function toLocalDateString(date: Date | null): string {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseLocalDateString(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  return new Date(y, m - 1, d)
}

interface IndonesianDatePickerProps {
  id?: string
  name: string
  defaultValue?: string
  value?: string
  onChange?: (val: string) => void
  required?: boolean
  placeholder?: string
  className?: string
}

export function IndonesianDatePicker({
  id: htmlId,
  name,
  defaultValue,
  value,
  onChange,
  required,
  placeholder = 'dd/mm/yyyy',
  className = '',
}: IndonesianDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    parseLocalDateString(value !== undefined ? value : defaultValue)
  )

  // Sync internal state if controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedDate(parseLocalDateString(value))
    }
  }, [value])

  const handleChange = (date: Date | null) => {
    if (value === undefined) {
      setSelectedDate(date)
    }
    if (onChange) {
      onChange(toLocalDateString(date))
    }
  }

  const baseClassName = "w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
  const finalClassName = className ? `${baseClassName} ${className}` : baseClassName

  return (
    <div className="relative w-full">
      <DatePicker
        id={htmlId}
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="dd/MM/yyyy"
        locale={id}
        placeholderText={placeholder}
        className={finalClassName}
        required={required}
        autoComplete="off"
        showPopperArrow={false}
        popperPlacement="bottom-start"
        // Ensure wrapper takes full width
        wrapperClassName="w-full"
      />
      {/* Hidden input to ensure the server gets YYYY-MM-DD exactly */}
      <input type="hidden" name={name} value={toLocalDateString(selectedDate)} />
    </div>
  )
}
