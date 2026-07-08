import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useSchedule } from '@/hooks/useSchedule'
import { scheduleRepository } from '@/repositories/SupabaseScheduleRepository'
import { useEffect, useState } from 'react'
import type { AcademicPeriod } from '@/types/academic'

export function SettingsPage() {
  const {
    loading,
    settings,
    careers,
    setSelectedCareer,
    setSelectedPeriod,
    syncNow,
    syncStatus,
  } = useSchedule()
  const { canInstall, install } = useInstallPrompt()
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])

  useEffect(() => {
    void scheduleRepository.getAcademicPeriods().then(setPeriods)
  }, [])

  if (loading || !settings) {
    return <LoadingState label="Cargando configuración..." />
  }

  return (
    <div className="space-y-5">
      <Card title="Preferencias académicas">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Periodo académico"
            value={settings.selectedAcademicPeriodId ?? ''}
            onChange={(event) =>
              void setSelectedPeriod(event.target.value || null)
            }
            options={[
              { value: '', label: 'Automático (periodo activo)' },
              ...periods.map((period) => ({
                value: period.id,
                label: period.name,
              })),
            ]}
          />
          <Select
            label="Carrera"
            value={settings.selectedCareerId ?? ''}
            onChange={(event) => void setSelectedCareer(event.target.value || null)}
            options={[
              { value: '', label: 'Todas las carreras' },
              ...careers.map((career) => ({
                value: career.id,
                label: `${career.code} · ${career.name}`,
              })),
            ]}
          />
        </div>
      </Card>

      <Card title="Datos y sincronización">
        <p className="text-sm text-muted">
          PoliPlan guarda tus selecciones en IndexedDB y sincroniza datos oficiales cuando hay
          internet. Estado actual: <strong>{syncStatus}</strong>.
        </p>
        <Button className="mt-4" variant="secondary" onClick={() => void syncNow(true)}>
          Buscar actualizaciones
        </Button>
      </Card>

      <Card title="Instalar aplicación">
        <p className="text-sm text-muted">
          Instalá PoliPlan como PWA para acceder más rápido desde tu celular o computadora.
        </p>
        <Button
          className="mt-4"
          disabled={!canInstall}
          onClick={() => void install()}
        >
          {canInstall ? 'Instalar PoliPlan' : 'Instalación no disponible en este navegador'}
        </Button>
      </Card>

      <Card title="Cuenta">
        <p className="text-sm text-muted">
          La autenticación con Supabase Auth quedará disponible en una versión futura para
          sincronizar tu horario entre dispositivos. Por ahora, todo se guarda localmente.
        </p>
      </Card>
    </div>
  )
}
