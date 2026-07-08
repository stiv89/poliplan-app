import type { ParsedScheduleRow, ScheduleValidationResult, ScheduleValidator } from '../types'

export class DefaultScheduleValidator implements ScheduleValidator {
  validate(rows: ParsedScheduleRow[]): ScheduleValidationResult {
    const errors: string[] = []

    if (rows.length === 0) {
      errors.push('El archivo no contiene filas válidas.')
    }

    rows.forEach((row, index) => {
      if (!row.courseName) {
        errors.push(`Fila ${index + 1}: falta nombre de materia.`)
      }
      if (!row.sectionCode) {
        errors.push(`Fila ${index + 1}: falta código de sección.`)
      }
      if (row.dayOfWeek < 1 || row.dayOfWeek > 6) {
        errors.push(`Fila ${index + 1}: día inválido.`)
      }
      if (!row.startTime || !row.endTime) {
        errors.push(`Fila ${index + 1}: horario incompleto.`)
      }
    })

    return { valid: errors.length === 0, errors }
  }
}
