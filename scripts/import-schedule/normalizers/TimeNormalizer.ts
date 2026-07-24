import type { ImportIssue } from '../types'
import { cellToRawString } from './TextNormalizer'

const TIME_PATTERN =
  /(\d{1,2})[:.](\d{2})\s*(?:-\s*(\d{1,2})[:.](\d{2}))?(?:\s*(am|pm))?/i

export function normalizeTime(value: unknown): string | null {
  const parsed = parseTimeRange(value)
  return parsed?.startTime ?? null
}

export function parseTimeRange(value: unknown): {
  startTime: string
  endTime: string
} | null {
  if (value == null || cellToRawString(value) === '') {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return excelSerialToRange(value)
  }

  if (value instanceof Date) {
    return dateToRange(value)
  }

  const raw = cellToRawString(value)
  if (!raw) {
    return null
  }

  const numeric = Number(raw.replace(',', '.'))
  if (!Number.isNaN(numeric) && raw.match(/^\d+([.,]\d+)?$/)) {
    const fromSerial = excelSerialToRange(numeric)
    if (fromSerial) {
      return fromSerial
    }
  }

  // Avoid matching HH:mm inside ISO datetimes (e.g. 1899-12-30T21:50:40.000Z → 21:50).
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const isoDate = new Date(raw)
    if (!Number.isNaN(isoDate.getTime())) {
      return dateToRange(isoDate)
    }
    return null
  }

  const normalized = raw
    .replace(/\u2013|\u2014|–|—/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

  const match = normalized.match(TIME_PATTERN)
  if (!match) {
    return null
  }

  let startHour = Number(match[1])
  const startMinute = Number(match[2])
  let endHour = match[3] ? Number(match[3]) : startHour + 1
  const endMinute = match[4] ? Number(match[4]) : startMinute
  const meridiem = match[5]?.toLowerCase()

  if (meridiem === 'pm' && startHour < 12) {
    startHour += 12
  }
  if (meridiem === 'pm' && endHour < 12) {
    endHour += 12
  }

  const startTime = toTimeString(startHour, startMinute)
  const endTime = toTimeString(endHour, endMinute)

  if (compareTimes(startTime, endTime) >= 0) {
    return null
  }

  return { startTime, endTime }
}

export function excelSerialToRange(serial: number): { startTime: string; endTime: string } | null {
  const timeFraction = serial >= 1 ? serial % 1 : serial
  if (timeFraction <= 0) {
    return null
  }

  const totalMinutes = Math.round(timeFraction * 24 * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const startTime = toTimeString(hours, minutes)
  const endMinutes = totalMinutes + 60
  const endTime = toTimeString(Math.floor(endMinutes / 60), endMinutes % 60)
  return { startTime, endTime }
}

export function dateToRange(date: Date): { startTime: string; endTime: string } | null {
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const startTime = toTimeString(date.getHours(), date.getMinutes())
  const endHour = (date.getHours() + 1) % 24
  const endTime = toTimeString(endHour, date.getMinutes())
  return { startTime, endTime }
}

export function toTimeString(hours: number, minutes: number): string {
  let totalMinutes = hours * 60 + minutes
  if (totalMinutes < 0) totalMinutes = 0
  totalMinutes = totalMinutes % (24 * 60)
  const normalizedHours = Math.floor(totalMinutes / 60)
  const normalizedMinutes = totalMinutes % 60
  return `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}:00`
}

export function compareTimes(left: string, right: string): number {
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return (hours ?? 0) * 60 + (minutes ?? 0)
  }
  return toMinutes(left) - toMinutes(right)
}

/** Excel serial day → YYYY-MM-DD (epoch 1899-12-30, ignoring legacy 1900 leap bug). */
export function excelSerialToDateString(serial: number): string | null {
  if (!Number.isFinite(serial)) return null
  const day = Math.floor(serial)
  // Reasonable academic-window guard (≈ 1990–2060).
  if (day < 32874 || day > 58400) return null
  const utc = Date.UTC(1899, 11, 30) + day * 86_400_000
  return new Date(utc).toISOString().slice(0, 10)
}

function isPlausibleAcademicDate(isoDate: string): boolean {
  const year = Number(isoDate.slice(0, 4))
  return year >= 1990 && year <= 2100
}

export function parseExamDate(value: unknown): string | null {
  if (value == null) {
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return excelSerialToDateString(value)
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const iso = value.toISOString().slice(0, 10)
    return isPlausibleAcademicDate(iso) ? iso : null
  }

  const raw = cellToRawString(value)
  if (!raw) {
    return null
  }

  const slashMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (slashMatch) {
    const day = slashMatch[1]?.padStart(2, '0')
    const month = slashMatch[2]?.padStart(2, '0')
    let year = slashMatch[3] ?? ''
    if (year.length === 2) {
      year = Number(year) >= 70 ? `19${year}` : `20${year}`
    }
    const iso = `${year}-${month}-${day}`
    return isPlausibleAcademicDate(iso) ? iso : null
  }

  // Bare Excel serial stored as text (e.g. "46360") — never feed to Date(), which
  // treats it as a year and yields "+046360-01".
  if (/^\d+(\.\d+)?$/.test(raw.trim())) {
    return excelSerialToDateString(Number(raw))
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().slice(0, 10)
    return isPlausibleAcademicDate(iso) ? iso : null
  }

  return null
}

export function parseScheduleCell(
  scheduleValue: unknown,
  issueSink: (issue: ImportIssue) => void,
  context: { sheetName: string; rowNumber: number; dayLabel: string },
): { startTime: string; endTime: string } | null {
  const range = parseTimeRange(scheduleValue)
  if (!range) {
    const raw = cellToRawString(scheduleValue)
    if (raw && !['---', '-- --', '-'].includes(raw)) {
      issueSink({
        code: 'INVALID_SCHEDULE_TIME',
        message: `Horario inválido en ${context.dayLabel}: "${raw}"`,
        severity: 'warning',
        sheetName: context.sheetName,
        rowNumber: context.rowNumber,
      })
    }
    return null
  }
  return range
}
