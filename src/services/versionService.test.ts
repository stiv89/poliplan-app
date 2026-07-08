import { describe, expect, it } from 'vitest'
import type { ScheduleVersion } from '@/types/academic'
import { compareVersions, isRemoteVersionNewer } from '@/services/versionService'

describe('versionService', () => {
  const remote: ScheduleVersion = {
    id: 'v2',
    academicPeriodId: 'period-1',
    version: 2,
    sourceUrl: null,
    sourceFileName: 'horarios.xlsx',
    sourceChecksum: 'abc123',
    sourceModifiedAt: null,
    importedAt: '2026-07-01T00:00:00.000Z',
    isActive: true,
    importStatus: 'success',
    errorMessage: null,
  }

  it('detecta versión remota más nueva por número', () => {
    expect(isRemoteVersionNewer(remote, 1, 'old')).toBe(true)
  })

  it('detecta checksum distinto con misma versión', () => {
    expect(isRemoteVersionNewer({ ...remote, version: 1 }, 1, 'different')).toBe(true)
  })

  it('no marca actualización si no hay versión remota', () => {
    expect(isRemoteVersionNewer(null, 1, 'abc123')).toBe(false)
  })

  it('compara números de versión', () => {
    expect(compareVersions(2, 1)).toBeGreaterThan(0)
    expect(compareVersions(null, 3)).toBeLessThan(0)
  })
})
