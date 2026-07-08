import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { ImportReport } from '../types'

export class JsonReporter {
  async write(report: ImportReport, outputPath: string): Promise<void> {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8')
    console.log(`Reporte JSON generado en ${outputPath}`)
  }
}
