import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function loadAdminEnv(): void {
  const adminEnvPath = resolve(process.cwd(), '.env.admin')
  if (!existsSync(adminEnvPath)) {
    return
  }

  for (const line of readFileSync(adminEnvPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    if (key && !process.env[key]) {
      process.env[key] = value
    }
  }
}

export const DEFAULT_ACADEMIC_PERIOD_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
