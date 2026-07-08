import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import XLSX from 'xlsx'
import { runScheduleSourceCheck } from '../checkScheduleSource'

async function createScheduleWorkbook(rows: number): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'poliplan-schedule-flow-'))
  const filePath = join(dir, 'schedule.xlsx')
  const workbook = XLSX.utils.book_new()
  const template: unknown[][] = [
    [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    [null, 'ASIGNATURA', null, null, null, 'CARRERA', null, null, null, null, null, 'DOCENTE', null, null, null, '1er. Parcial'],
    [
      'Item', 'DPTO.', 'Asignatura', 'Nivel', 'Sem/Grupo', 'Sigla carrera', 'Enfasis', 'Plan', 'Turno', 'Sección',
      'Plataforma de aula virtual', 'Tít', 'Apellido', 'Nombre', 'Correo Institucional', 'Día', 'Hora', 'AULA',
      'Día', 'Hora', 'AULA', 'Día', 'Hora', 'AULA', 'Día', 'Hora', 'Día', 'Hora', 'AULA', 'Día', 'Hora',
      'Presidente', 'Miembro', 'Miembro', 'AULA', 'Lunes', 'AULA', 'Martes', 'AULA', 'Miércoles', 'AULA', 'Jueves', 'AULA', 'Viernes', 'AULA', 'Sábado',
    ],
  ]

  for (let index = 0; index < rows; index += 1) {
    template.push([
      `${index + 1}`,
      'DCB',
      `Materia ${index + 1}`,
      '2',
      '2',
      'IIN',
      '-- --',
      '2008',
      'M',
      `MI${index + 1}`,
      'EDUCA',
      'Lic.',
      'Perez',
      'Juan',
      'juan@pol.una.py',
      'Mar 07/04/26',
      '08:00',
      'E03',
      'Mar 26/05/26',
      '08:00',
      'E03',
      'Mar 16/06/26',
      '08:00',
      'C11',
      'Vie 26/06/26',
      '10:30',
      'Mar 07/07/26',
      '08:00',
      'C11',
      'Vie 17/07/26',
      '10:30',
      'Presidente',
      'Miembro 1',
      'Miembro 2',
      'A52',
      null,
      'C12',
      '09:15 - 12:15',
      null,
      'C12',
      '10:00 - 12:15',
    ])
  }

  const sheet = XLSX.utils.aoa_to_sheet(template)
  XLSX.utils.book_append_sheet(workbook, sheet, 'IIN')
  XLSX.writeFile(workbook, filePath)
  return filePath
}

describe('runScheduleSourceCheck', () => {
  it('ejecuta dry-run exitoso cuando el archivo es nuevo', async () => {
    const workbookPath = await createScheduleWorkbook(10)
    const workbookBytes = await readFile(workbookPath)

    const report = await runScheduleSourceCheck(
      {
        sourceUrl: 'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/',
        dryRun: true,
        downloadOnly: false,
        verbose: false,
      },
      {
        fetchImpl: async (input) => {
          const url = String(input)
          if (url.includes('horarios-de-clases-y-examenes')) {
            return new Response(`<!doctype html><html><body><a href="https://drive.google.com/drive/folders/abc">Horario de clases y exámenes Primer Periodo 2026 –</a></body></html>`, {
              status: 200,
              headers: { 'content-type': 'text/html' },
            })
          }
          if (url.includes('/drive/folders/abc')) {
            return new Response(`<!doctype html><html><body><table><tr role="row" data-id="file-abc"><td><strong>Horario de clases y examenes Primer Periodo 2026 06072026.xlsx</strong></td></tr></table></body></html>`, {
              status: 200,
              headers: { 'content-type': 'text/html' },
            })
          }
          return new Response(workbookBytes, {
            status: 200,
            headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          })
        },
        compareWithSupabase: async () => ({
          available: false,
          blockedReason: 'no env',
          alreadyProcessed: false,
          lastSuccessfulChecksum: null,
          lastActiveVersion: null,
          lastSuccessfulImport: null,
        }),
      },
    )

    expect(report.status).toBe('dry-run-ok')
    expect(report.dryRun?.criticalErrors).toBe(0)
    expect(report.file?.sheetCount).toBeGreaterThanOrEqual(1)
  })

  it('marca errores críticos cuando el workbook es insuficiente', async () => {
    const workbookPath = await createScheduleWorkbook(2)
    const workbookBytes = await readFile(workbookPath)

    const report = await runScheduleSourceCheck(
      {
        sourceUrl: 'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/',
        dryRun: true,
        downloadOnly: false,
        verbose: false,
      },
      {
        fetchImpl: async (input) => {
          const url = String(input)
          if (url.includes('horarios-de-clases-y-examenes')) {
            return new Response(`<!doctype html><html><body><a href="https://drive.google.com/drive/folders/abc">Horario de clases y exámenes Primer Periodo 2026 –</a></body></html>`, {
              status: 200,
              headers: { 'content-type': 'text/html' },
            })
          }
          if (url.includes('/drive/folders/abc')) {
            return new Response(`<!doctype html><html><body><table><tr role="row" data-id="file-abc"><td><strong>Horario de clases y examenes Primer Periodo 2026 06072026.xlsx</strong></td></tr></table></body></html>`, {
              status: 200,
              headers: { 'content-type': 'text/html' },
            })
          }
          return new Response(workbookBytes, {
            status: 200,
            headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          })
        },
        compareWithSupabase: async () => ({
          available: false,
          blockedReason: 'no env',
          alreadyProcessed: false,
          lastSuccessfulChecksum: null,
          lastActiveVersion: null,
          lastSuccessfulImport: null,
        }),
      },
    )

    expect(report.status).toBe('dry-run-with-errors')
    expect(report.dryRun?.criticalErrors).toBeGreaterThan(0)
  })
})
