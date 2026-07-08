import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { PlaceholderExcelScheduleParser } from './parsers/ExcelScheduleParser'
import { DefaultScheduleNormalizer } from './normalizers/ScheduleNormalizer'
import { DefaultScheduleValidator } from './validators/ScheduleValidator'
import type { ScheduleImporter } from './types'

export async function calculateSha256(filePath: string): Promise<string> {
  const content = await readFile(filePath)
  return createHash('sha256').update(content).digest('hex')
}

export class NodeScheduleImporter implements ScheduleImporter {
  constructor(
    private parser = new PlaceholderExcelScheduleParser(),
    private normalizer = new DefaultScheduleNormalizer(),
    private validator = new DefaultScheduleValidator(),
  ) {}

  async importFromFile(filePath: string, _source?: { url: string; fileName: string }) {
    const checksum = await calculateSha256(filePath)
    const parsed = await this.parser.parse(filePath)
    const normalized = await this.normalizer.normalize(parsed)
    const validation = this.validator.validate(normalized)

    if (!validation.valid) {
      return {
        rowsProcessed: 0,
        rowsRejected: normalized.length,
        version: 0,
        errors: validation.errors,
      }
    }

    return {
      rowsProcessed: normalized.length,
      rowsRejected: 0,
      version: 0,
      checksum,
      message:
        'Importador preparado. La inserción en Supabase se implementará en una etapa posterior.',
    }
  }
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Uso: npm run import:schedule -- ./archivo.xlsx')
    process.exit(1)
  }

  const importer = new NodeScheduleImporter()
  const result = await importer.importFromFile(filePath)
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
