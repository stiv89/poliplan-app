import { useEffect, useMemo, useState } from 'react'
import { LoadingState } from '@/components/feedback/LoadingState'
import { SettingsAccountPanel } from '@/components/settings/SettingsAccountSection'
import {
  SETTINGS_CATEGORIES,
  SettingsActionRow,
  SettingsCategoryNav,
  SettingsDesktopLayout,
  SettingsDetailRow,
  SettingsInfoRow,
  SettingsInlineActions,
  SettingsMobileCategoryList,
  SettingsMobilePanel,
  SettingsPageShell,
  SettingsPanel,
  SettingsPickerSheet,
  SettingsSection,
  SettingsToggleRow,
  type SettingsCategoryId,
} from '@/components/settings/SettingsList'
import { Button } from '@/components/ui/Button'
import { useDataTrustInfo } from '@/components/ui/DataTrustBanner'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useSchedule } from '@/hooks/useSchedule'
import { scheduleRepository } from '@/repositories/SupabaseScheduleRepository'
import type { AcademicPeriod, SyncStatus } from '@/types/academic'
import { formatDateTime } from '@/utils/dates'

function formatLastUpdatedLabel(iso: string | null): string {
  if (!iso) return 'Sin registro'

  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    const time = date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })
    return `Hoy, ${time}`
  }

  return formatDateTime(iso)
}

function syncStatusLabel(status: SyncStatus): string {
  switch (status) {
    case 'idle':
      return 'Sincronizado'
    case 'checking':
      return 'Verificando…'
    case 'downloading':
      return 'Descargando…'
    case 'updated':
      return 'Actualizado'
    case 'offline':
      return 'Sin conexión'
    case 'error':
      return 'Error al sincronizar'
    default:
      return 'Desconocido'
  }
}

function categoryLabel(id: SettingsCategoryId): string {
  return SETTINGS_CATEGORIES.find((category) => category.id === id)?.label ?? 'Ajustes'
}

export function SettingsPage() {
  const {
    loading,
    settings,
    careers,
    activePeriod,
    setSelectedCareer,
    setSelectedPeriod,
    updateAppSettings,
    resetPreferences,
    clearSchedule,
    syncNow,
    syncStatus,
    syncMessage,
    lastUpdated,
    isOnline,
  } = useSchedule()

  const trustInfo = useDataTrustInfo()
  const { canInstall, isInstalled, install } = useInstallPrompt()
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId>('account')
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [picker, setPicker] = useState<'period' | 'career' | 'install' | null>(null)
  const [installHint, setInstallHint] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    void scheduleRepository.getAcademicPeriods().then(setPeriods)
  }, [])

  const selectedCareer = careers.find((career) => career.id === settings?.selectedCareerId)
  const selectedPeriod = settings?.selectedAcademicPeriodId
    ? periods.find((period) => period.id === settings.selectedAcademicPeriodId)
    : null

  const periodLabel = selectedPeriod?.name ?? activePeriod?.name ?? 'Automático'
  const careerLabel = selectedCareer?.name ?? 'Sin elegir'
  const versionLabel = trustInfo ? `Versión ${trustInfo.version}` : 'Sin datos'
  const offlineLabel = trustInfo ? 'Disponible' : 'Sin datos locales'

  const periodOptions = useMemo(
    () => [
      { value: '', label: 'Automático' },
      ...periods.map((period) => ({
        value: period.id,
        label: period.name,
        subtitle: period.isActive ? 'Activo' : undefined,
      })),
    ],
    [periods],
  )

  const careerOptions = useMemo(
    () => [
      { value: '', label: 'Sin elegir' },
      ...careers.map((career) => ({
        value: career.id,
        label: career.name,
        subtitle: career.code ?? undefined,
      })),
    ],
    [careers],
  )

  const handleInstall = async () => {
    if (canInstall) {
      await install()
      return
    }
    setInstallHint(
      isInstalled
        ? 'PoliPlan ya está instalada en este dispositivo.'
        : 'En Safari: Compartir → Agregar a inicio.',
    )
    setPicker('install')
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncNow(true)
    } finally {
      setSyncing(false)
    }
  }

  const handleResetPreferences = async () => {
    if (!window.confirm('¿Restablecer las preferencias a los valores iniciales?')) return
    await resetPreferences()
  }

  const handleClearSchedule = async () => {
    if (
      !window.confirm(
        '¿Eliminar todas las secciones del horario actual en este dispositivo? Esta acción no se puede deshacer.',
      )
    ) {
      return
    }
    await clearSchedule()
  }

  const handleForceDownload = async () => {
    if (
      !window.confirm(
        '¿Reemplazar la copia local con la última versión disponible de horarios?',
      )
    ) {
      return
    }
    await handleSync()
  }

  const selectCategory = (id: SettingsCategoryId) => {
    setActiveCategory(id)
    setMobilePanelOpen(true)
  }

  const renderPanel = (category: SettingsCategoryId) => {
    switch (category) {
      case 'account':
        return (
          <SettingsPanel
            title="Cuenta"
            description="Iniciá sesión para sincronizar tu experiencia entre dispositivos."
          >
            <SettingsAccountPanel />
          </SettingsPanel>
        )

      case 'academic':
        return (
          <SettingsPanel
            title="Preferencias académicas"
            description="Elegí el periodo y la carrera para filtrar materias y secciones."
          >
            <SettingsSection>
              <SettingsDetailRow
                label="Periodo académico"
                description="El periodo cuyos horarios querés consultar."
                value={periodLabel}
                onPress={() => setPicker('period')}
              />
              <SettingsDetailRow
                label="Carrera"
                description="Filtra las materias y secciones disponibles."
                value={careerLabel}
                onPress={() => setPicker('career')}
              />
            </SettingsSection>
          </SettingsPanel>
        )

      case 'notifications':
        return (
          <SettingsPanel
            title="Avisos y actualizaciones"
            description="Controlá cuándo PoliPlan te avisa sobre cambios en tus materias."
          >
            <SettingsSection>
              <SettingsToggleRow
                label="Avisarme cuando cambien mis materias"
                description="Muestra cambios de horarios, aulas y exámenes."
                checked={settings?.showChangeAlerts ?? true}
                onChange={(checked) => void updateAppSettings({ showChangeAlerts: checked })}
              />
              <SettingsToggleRow
                label="Buscar actualizaciones al abrir PoliPlan"
                description="Comprueba si la Facultad publicó una versión nueva."
                checked={settings?.syncOnOpen ?? true}
                onChange={(checked) => void updateAppSettings({ syncOnOpen: checked })}
              />
            </SettingsSection>
          </SettingsPanel>
        )

      case 'data':
        return (
          <SettingsPanel
            title="Datos y conexión"
            description="Estado de los horarios guardados en este dispositivo."
          >
            <SettingsSection>
              <SettingsInfoRow label="Estado" value={syncStatusLabel(syncStatus)} />
              <SettingsInfoRow
                label="Última actualización"
                value={formatLastUpdatedLabel(lastUpdated ?? trustInfo?.downloadedAt ?? null)}
              />
              <SettingsInfoRow label="Versión de horarios" value={versionLabel} />
              <SettingsInfoRow
                label="Disponibilidad offline"
                description="Los datos descargados están disponibles sin conexión."
                value={isOnline ? offlineLabel : 'Sin conexión ahora'}
              />
            </SettingsSection>
            {syncMessage && (
              <p className="mt-3 text-xs text-muted">{syncMessage}</p>
            )}
            <SettingsInlineActions>
              <Button
                variant="secondary"
                className="justify-center"
                onClick={() => void handleSync()}
                disabled={syncing || !isOnline}
              >
                {syncing ? 'Buscando…' : 'Buscar actualizaciones'}
              </Button>
            </SettingsInlineActions>
            {!isOnline && (
              <p className="mt-2 text-xs text-muted">
                Conectate a internet para buscar actualizaciones.
              </p>
            )}
          </SettingsPanel>
        )

      case 'app':
        return (
          <SettingsPanel
            title="Aplicación"
            description="Opciones para instalar y usar PoliPlan en tu dispositivo."
          >
            {(canInstall || isInstalled) && (
              <SettingsSection>
                <SettingsDetailRow
                  label="Instalar PoliPlan"
                  description="Agregá la aplicación al inicio de tu dispositivo."
                  value={isInstalled ? 'Instalada' : 'Disponible'}
                  onPress={() => void handleInstall()}
                />
              </SettingsSection>
            )}
            {!canInstall && !isInstalled && (
              <p className="text-sm text-muted">
                La instalación no está disponible en este navegador.
              </p>
            )}
          </SettingsPanel>
        )

      case 'advanced':
        return (
          <SettingsPanel
            title="Avanzado"
            description="Acciones que modifican datos locales o preferencias guardadas."
          >
            <SettingsSection>
              <SettingsActionRow
                label="Restablecer preferencias"
                description="Vuelve a los valores iniciales."
                onPress={() => void handleResetPreferences()}
              />
              <SettingsActionRow
                label="Eliminar horario local"
                description="Borra las secciones elegidas en este dispositivo."
                destructive
                onPress={() => void handleClearSchedule()}
              />
              <SettingsActionRow
                label="Forzar descarga de datos"
                description="Reemplaza la copia local con la última versión disponible."
                onPress={() => void handleForceDownload()}
              />
            </SettingsSection>
          </SettingsPanel>
        )

      default:
        return null
    }
  }

  if (loading || !settings) {
    return <LoadingState label="Cargando…" />
  }

  return (
    <SettingsPageShell title="Ajustes">
      <SettingsDesktopLayout
        nav={
          <SettingsCategoryNav active={activeCategory} onSelect={setActiveCategory} />
        }
        panel={renderPanel(activeCategory)}
      />

      {!mobilePanelOpen && (
        <SettingsMobileCategoryList onSelect={selectCategory} />
      )}

      {mobilePanelOpen && (
        <SettingsMobilePanel
          title={categoryLabel(activeCategory)}
          onBack={() => setMobilePanelOpen(false)}
        >
          {renderPanel(activeCategory)}
        </SettingsMobilePanel>
      )}

      <SettingsPickerSheet
        open={picker === 'period'}
        title="Periodo académico"
        options={periodOptions}
        selectedValue={settings.selectedAcademicPeriodId ?? ''}
        onSelect={(value) => void setSelectedPeriod(value || null)}
        onClose={() => setPicker(null)}
      />

      <SettingsPickerSheet
        open={picker === 'career'}
        title="Carrera"
        options={careerOptions}
        selectedValue={settings.selectedCareerId ?? ''}
        onSelect={(value) => void setSelectedCareer(value || null)}
        onClose={() => setPicker(null)}
      />

      {picker === 'install' && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-[2px]"
            onClick={() => {
              setPicker(null)
              setInstallHint(null)
            }}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-surface p-5 shadow-xl md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
            role="dialog"
            aria-label="Instalar PoliPlan"
          >
            <p className="font-semibold text-text">Instalar PoliPlan</p>
            <p className="mt-2 text-sm text-muted">
              {installHint ?? 'No disponible en este navegador.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setPicker(null)
                setInstallHint(null)
              }}
              className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-white"
            >
              Entendido
            </button>
          </div>
        </>
      )}
    </SettingsPageShell>
  )
}
