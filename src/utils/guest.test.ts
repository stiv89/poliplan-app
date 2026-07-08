import { describe, expect, it } from 'vitest'
import { shouldShowNotificationPrompt, shouldShowSyncPrompt } from '@/utils/guestPrompts'
import { getScheduleSaveStatus } from '@/utils/scheduleSaveStatus'

describe('guest prompts', () => {
  it('shows sync prompt when never dismissed', () => {
    expect(shouldShowSyncPrompt(null)).toBe(true)
  })

  it('hides sync prompt during cooldown', () => {
    expect(shouldShowSyncPrompt(new Date().toISOString())).toBe(false)
  })

  it('shows notification prompt after cooldown', () => {
    const old = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldShowNotificationPrompt(old)).toBe(true)
  })
})

describe('schedule save status', () => {
  it('shows offline label', () => {
    const status = getScheduleSaveStatus({
      isOnline: false,
      isAuthenticated: false,
      localSaveState: 'idle',
      userSyncAt: null,
      officialDataSyncing: false,
    })
    expect(status.label).toContain('Sin conexión')
  })

  it('shows synced state for authenticated users', () => {
    const status = getScheduleSaveStatus({
      isOnline: true,
      isAuthenticated: true,
      localSaveState: 'idle',
      userSyncAt: new Date().toISOString(),
      officialDataSyncing: false,
    })
    expect(status.label).toBe('Sincronizado')
    expect(status.showSyncedCheck).toBe(true)
  })

  it('shows saving state', () => {
    const status = getScheduleSaveStatus({
      isOnline: true,
      isAuthenticated: false,
      localSaveState: 'saving',
      userSyncAt: null,
      officialDataSyncing: false,
    })
    expect(status.label).toBe('Guardando…')
  })
})
