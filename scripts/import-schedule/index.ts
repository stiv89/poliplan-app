import { buildCli } from './cli'
import { loadAdminEnv } from '../admin/load-env.ts'

loadAdminEnv()

buildCli().parseAsync(process.argv).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
