import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function parseEnvFile(path: string): void {
  if (!existsSync(path)) return

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '')
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

export function loadAdminEnv(): void {
  parseEnvFile(resolve(process.cwd(), '.env.admin'))
  parseEnvFile(resolve(process.cwd(), '.env'))

  if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL
  }
}

export const DEFAULT_ACADEMIC_PERIOD_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
