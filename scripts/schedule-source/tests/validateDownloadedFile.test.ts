import { describe, expect, it } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import XLSX from 'xlsx'
import { validateDownloadedFile } from '../validateDownloadedFile'

async function createWorkbookFile(sheetCount = 1): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'poliplan-xlsx-test-'))
  const filePath = join(dir, 'sample.xlsx')
  const workbook = XLSX.utils.book_new()
  for (let index = 0; index < sheetCount; index += 1) {
    const sheet = XLSX.utils.aoa_to_sheet([
      ['A', 'B'],
      [1, 2],
    ])
    XLSX.utils.book_append_sheet(workbook, sheet, index === 0 ? 'IAE' : `Sheet${index}`)
  }
  XLSX.writeFile(workbook, filePath)
  return filePath
}

describe('validateDownloadedFile', () => {
  it('acepta un xlsx válido con hojas académicas', async () => {
    const filePath = await createWorkbookFile()
    const result = await validateDownloadedFile({
      filePath,
      fileName: 'sample.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      sizeBytes: 0,
      responseUrl: 'https://example.com/sample.xlsx',
    })

    expect(result.sheetCount).toBe(1)
    expect(result.academicSheetCount).toBe(1)
  })

  it('rechaza HTML descargado por error', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'poliplan-html-test-'))
    const filePath = join(dir, 'sample.xlsx')
    await writeFile(filePath, '<html><body>No es un xlsx</body></html>', 'utf8')

    await expect(
      validateDownloadedFile({
        filePath,
        fileName: 'sample.xlsx',
        mimeType: 'text/html',
        sizeBytes: 0,
        responseUrl: 'https://example.com/sample.xlsx',
      }),
    ).rejects.toThrow(/HTML|XLSX|workbook/i)
  })
})
