import type { ExcelScheduleParser, ParsedScheduleRow } from '../types'

export class PlaceholderExcelScheduleParser implements ExcelScheduleParser {
  async parse(_filePath: string): Promise<ParsedScheduleRow[]> {
    throw new Error(
      'El parser de Excel aún no está implementado. Ver docs/IMPORTER.md',
    )
  }
}
