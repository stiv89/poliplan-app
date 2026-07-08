export type LocalSaveState = 'idle' | 'saving' | 'saved'

export interface SaveStatusInput {
  isOnline: boolean
  isAuthenticated: boolean
  localSaveState: LocalSaveState
  userSyncAt: string | null
  officialDataSyncing: boolean
}

export interface SaveStatusDisplay {
  label: string
  showSyncAction: boolean
  showSyncedCheck: boolean
}

export function getScheduleSaveStatus(input: SaveStatusInput): SaveStatusDisplay {
  if (input.localSaveState === 'saving' || input.officialDataSyncing) {
    return { label: 'Guardando…', showSyncAction: false, showSyncedCheck: false }
  }

  if (!input.isOnline) {
    return {
      label: 'Guardado localmente · Sin conexión',
      showSyncAction: true,
      showSyncedCheck: false,
    }
  }

  if (input.isAuthenticated && input.userSyncAt) {
    return {
      label: 'Sincronizado',
      showSyncAction: false,
      showSyncedCheck: true,
    }
  }

  if (input.localSaveState === 'saved') {
    return {
      label: 'Guardado',
      showSyncAction: !input.isAuthenticated,
      showSyncedCheck: false,
    }
  }

  return {
    label: input.isAuthenticated ? 'Guardado en este dispositivo' : 'Guardado en este dispositivo',
    showSyncAction: !input.isAuthenticated,
    showSyncedCheck: false,
  }
}

export function formatUserSyncAt(iso: string | null): string {
  if (!iso) return 'Sin sincronización previa'

  const date = new Date(iso)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    const time = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    return `Última sincronización: hoy, ${time}`
  }

  return `Última sincronización: ${date.toLocaleDateString('es-PY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}
