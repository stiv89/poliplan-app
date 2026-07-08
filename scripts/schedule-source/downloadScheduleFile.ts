import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import type { DownloadedScheduleFile, ScheduleLinkCandidate } from './types'

function sanitizeFileName(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, ' ')
  const cleaned = trimmed.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-')
  return cleaned || 'schedule.xlsx'
}

function fileNameFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url)
    const candidate = basename(pathname)
    if (candidate && candidate.includes('.')) {
      return candidate
    }
  } catch {
    // ignore
  }
  return 'schedule.xlsx'
}

function isHtmlContent(contentType: string, buffer: Buffer): boolean {
  if (/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    return true
  }
  const firstChunk = buffer.subarray(0, 64).toString('utf8').trimStart().toLowerCase()
  return firstChunk.startsWith('<!doctype html') || firstChunk.startsWith('<html')
}

export async function downloadScheduleFile(
  target: ScheduleLinkCandidate,
  fetchImpl: typeof fetch = fetch,
  outputDir?: string,
): Promise<DownloadedScheduleFile> {
  const destinationDir = outputDir ?? (await mkdtemp(join(tmpdir(), 'poliplan-schedule-')))
  const response = await fetchImpl(target.absoluteUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (PoliPlan schedule source checker)',
      accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,text/html;q=0.9,*/*;q=0.8',
    },
  })

  if (!response.ok) {
    throw new Error(`La descarga falló con ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = response.headers.get('content-type') ?? ''

  if (isHtmlContent(contentType, buffer)) {
    throw new Error('El enlace descargado devolvió HTML en vez de un XLSX')
  }

  const fileName = sanitizeFileName(target.text || fileNameFromUrl(response.url || target.absoluteUrl))
  const finalFileName = fileName.toLowerCase().endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  const filePath = join(destinationDir, finalFileName)

  await writeFile(filePath, buffer)

  return {
    filePath,
    fileName: finalFileName,
    mimeType: contentType.split(';')[0].trim() || 'application/octet-stream',
    sizeBytes: buffer.length,
    responseUrl: response.url || target.absoluteUrl,
  }
}
