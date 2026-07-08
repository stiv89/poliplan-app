#!/usr/bin/env tsx
import { loadAdminEnv, DEFAULT_ACADEMIC_PERIOD_ID } from '../admin/load-env.ts'
import { notifyScheduleUpdate } from '../email/notifyScheduleUpdate.ts'

async function main() {
  loadAdminEnv()

  const periodId =
    process.argv.find((arg) => arg.startsWith('--period-id='))?.split('=')[1] ??
    DEFAULT_ACADEMIC_PERIOD_ID
  const periodName =
    process.argv.find((arg) => arg.startsWith('--period-name='))?.split('=')[1] ?? undefined

  console.log(`Enviando avisos de horario para periodo ${periodId}…`)
  const result = await notifyScheduleUpdate({ periodId, periodName })

  if (!result) {
    console.error('No se pudo completar el envío.')
    process.exitCode = 1
    return
  }

  console.log(`Listo: ${result.sent} correos enviados de ${result.recipients} destinatarios.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
