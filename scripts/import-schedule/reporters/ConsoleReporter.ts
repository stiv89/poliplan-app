import type { ImportReport } from '../types'

export class ConsoleReporter {
  print(report: ImportReport, verbose = false): void {
    console.log('\n=== PoliPlan Import Report ===')
    console.log(`Archivo: ${report.metadata.sourceFile}`)
    console.log(`Checksum: ${report.metadata.checksum}`)
    console.log(`Hojas procesadas: ${report.metadata.sheetsProcessed.length}`)
    console.log(`Hojas ignoradas: ${report.metadata.sheetsIgnored.length}`)
    console.log('\nConteos:')
    console.log(`  Carreras:   ${report.summary.careers}`)
    console.log(`  Materias:   ${report.summary.courses}`)
    console.log(`  Secciones:  ${report.summary.sections}`)
    console.log(`  Reuniones:  ${report.summary.meetings}`)
    console.log(`  Exámenes:   ${report.summary.exams}`)
    console.log(`  Válidas:    ${report.summary.validRows}`)
    console.log(`  Rechazadas: ${report.summary.rejectedRows}`)
    console.log(`  Advertencias: ${report.summary.warnings}`)
    console.log(`  Errores críticos: ${report.summary.criticalErrors}`)
    console.log(`  Duplicados: ${report.summary.duplicates}`)

    if (report.metadata.sheetsIgnored.length > 0) {
      console.log('\nHojas ignoradas:')
      for (const sheet of report.metadata.sheetsIgnored) {
        console.log(`  - ${sheet}`)
      }
    }

    if (verbose && report.sections.length > 0) {
      console.log('\nEjemplos de secciones:')
      for (const section of report.sections.slice(0, 5)) {
        console.log(
          `  - ${section.sourceSheet} fila ${section.sourceRow}: ${section.sectionCode} (${section.naturalKey})`,
        )
      }
    }

    if (verbose && report.meetings.length > 0) {
      console.log('\nEjemplos de reuniones:')
      for (const meeting of report.meetings.slice(0, 5)) {
        console.log(
          `  - día ${meeting.dayOfWeek} ${meeting.startTime}-${meeting.endTime} ${meeting.classroom ?? ''}`,
        )
      }
    }

    const critical = [...report.warnings, ...report.duplicates].filter(
      (issue) => issue.severity === 'critical',
    )
    if (critical.length > 0) {
      console.log('\nErrores críticos:')
      for (const issue of critical.slice(0, 20)) {
        console.log(`  - [${issue.code}] ${issue.message}`)
      }
    }
  }
}
