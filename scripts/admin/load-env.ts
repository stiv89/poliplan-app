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

export const ACADEMIC_PERIODS = [
  {
    id: DEFAULT_ACADEMIC_PERIOD_ID,
    name: 'Primer Periodo 2026',
    year: 2026,
    term: 1,
    starts_at: '2026-03-01',
    ends_at: '2026-07-31',
    is_active: true,
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    name: 'Primer Periodo Académico 2025 – Carreras de Grado',
    year: 2025,
    term: 1,
    starts_at: '2025-03-01',
    ends_at: '2025-07-31',
    is_active: false,
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    name: 'Segundo Periodo Académico 2025 – Carreras de Grado',
    year: 2025,
    term: 2,
    starts_at: '2025-08-01',
    ends_at: '2025-12-31',
    is_active: false,
  },
] as const

export const SECOND_PERIOD_2025_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3'
export const FIRST_PERIOD_2025_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
