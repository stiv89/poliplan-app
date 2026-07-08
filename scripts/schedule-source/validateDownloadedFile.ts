import { stat } from 'node:fs/promises'
import XLSX from 'xlsx'
import { classifySheetName } from '../import-schedule/config'
import type { ValidatedScheduleFile, DownloadedScheduleFile } from './types'

export async function validateDownloadedFile(
  downloadedFile: DownloadedScheduleFile,
): Promise<ValidatedScheduleFile> {
  const fileStat = await stat(downloadedFile.filePath)
  if (fileStat.size <= 0) {
    throw new Error('El archivo descargado está vacío')
  }

  if (!downloadedFile.filePath.toLowerCase().endsWith('.xlsx')) {
    throw new Error('El archivo descargado no tiene extensión XLSX')
  }

  const workbook = XLSX.readFile(downloadedFile.filePath, { cellDates: true })
  const sheetNames = workbook.SheetNames
  const academicSheetCount = sheetNames.filter((name) => {
    const kind = classifySheetName(name)
    return kind === 'career' || kind === 'campus'
  }).length

  if (sheetNames.length === 0) {
    throw new Error('El workbook no contiene hojas')
  }

  if (academicSheetCount === 0) {
    throw new Error('El workbook no contiene hojas académicas reconocibles')
  }

  return {
    ...downloadedFile,
    sizeBytes: fileStat.size,
    sheetCount: sheetNames.length,
    sheetNames,
    academicSheetCount,
  }
}
