import { DAYS_OF_WEEK } from '@/config/constants'
import type { CourseSection } from '@/types/academic'
import { getSectionScheduleTitle } from '@/utils/electiveCourses'
import { timeToMinutes } from '@/utils/times'

export interface ScheduleShareImageBlock {
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  title: string
  shortTitle: string
  sectionCode: string
  classroom: string | null
}

export interface ScheduleShareImageInput {
  scheduleName: string
  subtitle?: string | null
  blocks: ScheduleShareImageBlock[]
}

/** Pasteles saturados al estilo horario escolar. */
const GRID_BLOCK_COLORS = [
  { bg: '#A8D5A2', text: '#111827' },
  { bg: '#F4A7C0', text: '#111827' },
  { bg: '#F6D56A', text: '#111827' },
  { bg: '#C4B5E8', text: '#111827' },
  { bg: '#8EC5E8', text: '#111827' },
  { bg: '#F0B48A', text: '#111827' },
  { bg: '#7DD3D8', text: '#111827' },
  { bg: '#E8A0D0', text: '#111827' },
] as const

const THEME = {
  page: '#F4F7FB',
  surface: '#FFFFFF',
  header: '#B8D4F0',
  timeCol: '#B8D4F0',
  gridLine: '#1E293B',
  text: '#0F172A',
  muted: '#475569',
  primary: '#0B3B8F',
}

function hashCourseId(courseId: string): number {
  let hash = 0
  for (let i = 0; i < courseId.length; i += 1) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0
  }
  return hash
}

function getShareBlockColor(courseId: string) {
  return GRID_BLOCK_COLORS[hashCourseId(courseId) % GRID_BLOCK_COLORS.length]!
}

function shortCourseLabel(
  title: string,
  code: string | null | undefined,
  maxChars = 22,
): string {
  const fromCode = code?.trim()
  if (fromCode) return fromCode.length <= maxChars ? fromCode : `${fromCode.slice(0, maxChars - 1)}…`
  const trimmed = title.trim()
  if (trimmed.length <= maxChars) return trimmed
  return `${trimmed.slice(0, Math.max(1, maxChars - 1))}…`
}

export function buildScheduleShareBlocks(
  selectedSections: CourseSection[],
  coursesById: Map<string, { name: string; code?: string | null }>,
): ScheduleShareImageBlock[] {
  return selectedSections
    .flatMap((section) => {
      const course = coursesById.get(section.courseId)
      const title = getSectionScheduleTitle(section, course)
      const shortTitle = shortCourseLabel(title, course?.code)
      return section.meetings.map((meeting) => ({
        courseId: section.courseId,
        dayOfWeek: meeting.dayOfWeek,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        title,
        shortTitle,
        sectionCode: section.sectionCode,
        classroom: meeting.classroom,
      }))
    })
    .sort(
      (a, b) =>
        a.dayOfWeek - b.dayOfWeek ||
        a.startTime.localeCompare(b.startTime) ||
        a.title.localeCompare(b.title),
    )
}

/** Agrupa bloques por día (tests / compat). */
export function buildScheduleShareDays(
  selectedSections: CourseSection[],
  coursesById: Map<string, { name: string; code?: string | null }>,
) {
  const blocks = buildScheduleShareBlocks(selectedSections, coursesById)
  return DAYS_OF_WEEK.map((day) => ({
    dayLabel: day.label,
    entries: blocks
      .filter((block) => block.dayOfWeek === day.value)
      .map((block) => ({
        title: block.title,
        teacherName: null as string | null,
        startTime: block.startTime,
        endTime: block.endTime,
        classroom: block.classroom,
      })),
  })).filter((day) => day.entries.length > 0)
}

/** Horario semanal en grilla (días × horas), listo para compartir. */
export async function renderScheduleShareImage(
  input: ScheduleShareImageInput,
): Promise<Blob> {
  const blocks = input.blocks
  const daysWithClasses = DAYS_OF_WEEK.filter((day) =>
    blocks.some((block) => block.dayOfWeek === day.value),
  )
  // Lun–Vie por defecto; incluir sábado solo si hay clases
  const hasSaturday = daysWithClasses.some((day) => day.value === 6)
  const visibleDays = hasSaturday
    ? DAYS_OF_WEEK
    : DAYS_OF_WEEK.filter((day) => day.value <= 5)

  let startHour = 7
  let endHour = 21
  if (blocks.length > 0) {
    const mins = blocks.flatMap((block) => [
      timeToMinutes(block.startTime),
      timeToMinutes(block.endTime),
    ])
    startHour = Math.max(6, Math.floor(Math.min(...mins) / 60))
    endHour = Math.min(22, Math.ceil(Math.max(...mins) / 60))
    if (endHour <= startHour) endHour = startHour + 1
  }

  const hourCount = endHour - startHour
  const headerH = 88
  const dayHeaderH = 44
  const timeColW = 64
  const pad = 28
  const footerH = 32
  const rowH = hourCount <= 8 ? 58 : hourCount <= 12 ? 50 : 44
  const dayColW = Math.max(108, Math.min(132, Math.floor(720 / visibleDays.length)))
  const gridW = timeColW + visibleDays.length * dayColW
  const gridH = dayHeaderH + hourCount * rowH
  const width = pad * 2 + gridW
  const height = pad + headerH + gridH + footerH + pad

  const canvas = document.createElement('canvas')
  const scale = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el canvas')

  ctx.scale(scale, scale)
  ctx.fillStyle = THEME.page
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = THEME.primary
  ctx.font = '700 11px Helvetica Neue, Helvetica, Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('POLIPLAN', pad, pad + 14)

  ctx.fillStyle = THEME.text
  ctx.font = '700 22px Helvetica Neue, Helvetica, Arial, sans-serif'
  ctx.fillText(truncate(ctx, input.scheduleName, gridW), pad, pad + 42)

  if (input.subtitle) {
    ctx.fillStyle = THEME.muted
    ctx.font = '400 13px Helvetica Neue, Helvetica, Arial, sans-serif'
    ctx.fillText(truncate(ctx, input.subtitle, gridW), pad, pad + 64)
  }

  const gridX = pad
  const gridY = pad + headerH

  ctx.fillStyle = THEME.surface
  ctx.fillRect(gridX, gridY, gridW, gridH)

  // Header row + time column
  ctx.fillStyle = THEME.header
  ctx.fillRect(gridX, gridY, gridW, dayHeaderH)
  ctx.fillStyle = THEME.timeCol
  ctx.fillRect(gridX, gridY + dayHeaderH, timeColW, gridH - dayHeaderH)

  ctx.strokeStyle = THEME.gridLine
  ctx.lineWidth = 1.5
  ctx.strokeRect(gridX + 0.75, gridY + 0.75, gridW - 1.5, gridH - 1.5)

  // Vertical day dividers
  for (let i = 0; i <= visibleDays.length; i += 1) {
    const x = gridX + timeColW + i * dayColW
    ctx.beginPath()
    ctx.moveTo(x, gridY)
    ctx.lineTo(x, gridY + gridH)
    ctx.strokeStyle = THEME.gridLine
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Horizontal hour dividers
  for (let hour = startHour; hour <= endHour; hour += 1) {
    const y = gridY + dayHeaderH + (hour - startHour) * rowH
    ctx.beginPath()
    ctx.moveTo(gridX, y)
    ctx.lineTo(gridX + gridW, y)
    ctx.strokeStyle = THEME.gridLine
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Corner label
  ctx.fillStyle = THEME.text
  ctx.font = '700 12px Helvetica Neue, Helvetica, Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('Hora', gridX + timeColW / 2, gridY + dayHeaderH / 2)

  // Day labels
  visibleDays.forEach((day, index) => {
    const x = gridX + timeColW + index * dayColW
    ctx.fillStyle = THEME.text
    ctx.font = '700 13px Helvetica Neue, Helvetica, Arial, sans-serif'
    ctx.fillText(day.label, x + dayColW / 2, gridY + dayHeaderH / 2)
  })

  // Hour labels
  for (let hour = startHour; hour < endHour; hour += 1) {
    const y = gridY + dayHeaderH + (hour - startHour) * rowH
    ctx.fillStyle = THEME.text
    ctx.font = '600 11px Helvetica Neue, Helvetica, Arial, sans-serif'
    ctx.fillText(`${String(hour).padStart(2, '0')}:00`, gridX + timeColW / 2, y + rowH / 2)
  }

  // Course blocks (flush to grid cells)
  const startMin = startHour * 60
  const totalMin = hourCount * 60
  const bodyY = gridY + dayHeaderH
  const bodyH = hourCount * rowH

  for (const block of blocks) {
    const dayIndex = visibleDays.findIndex((day) => day.value === block.dayOfWeek)
    if (dayIndex < 0) continue

    const blockStart = Math.max(timeToMinutes(block.startTime), startMin)
    const blockEnd = Math.min(timeToMinutes(block.endTime), startMin + totalMin)
    if (blockEnd <= blockStart) continue

    const x = gridX + timeColW + dayIndex * dayColW
    const y = bodyY + ((blockStart - startMin) / totalMin) * bodyH
    const w = dayColW
    const h = Math.max(18, ((blockEnd - blockStart) / totalMin) * bodyH)

    const color = getShareBlockColor(block.courseId)
    ctx.fillStyle = color.bg
    ctx.fillRect(x + 0.5, y + 0.5, w - 1, h - 1)
    ctx.strokeStyle = THEME.gridLine
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)

    ctx.fillStyle = color.text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const nameLine = block.shortTitle
    const meta =
      h >= 44
        ? `${block.startTime.slice(0, 5)}–${block.endTime.slice(0, 5)}${
            block.sectionCode ? ` · ${block.sectionCode}` : ''
          }`
        : block.sectionCode || null

    if (h >= 44 && meta) {
      ctx.font = '700 12px Helvetica Neue, Helvetica, Arial, sans-serif'
      ctx.fillText(truncate(ctx, nameLine, w - 12), x + w / 2, y + h / 2 - 8)
      ctx.font = '600 10px Helvetica Neue, Helvetica, Arial, sans-serif'
      ctx.fillText(truncate(ctx, meta, w - 12), x + w / 2, y + h / 2 + 9)
    } else {
      ctx.font = '700 11px Helvetica Neue, Helvetica, Arial, sans-serif'
      const label = meta ? `${nameLine} ${meta}` : nameLine
      ctx.fillText(truncate(ctx, label, w - 10), x + w / 2, y + h / 2)
    }
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = THEME.muted
  ctx.font = '400 11px Helvetica Neue, Helvetica, Arial, sans-serif'
  ctx.fillText('poliplan.app', pad, height - 14)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('No se pudo exportar la imagen'))
    }, 'image/png')
  })
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let value = text
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) {
    value = value.slice(0, -1)
  }
  return `${value}…`
}

export async function copyImageBlob(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
      return true
    }
  } catch {
    // fall through
  }
  return false
}

export function downloadImageBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function slugifyFilename(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'horario'
  )
}
