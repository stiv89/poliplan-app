import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ROUTES } from '@/config/constants'
import { useSchedule } from '@/hooks/useSchedule'
import { formatDateTime } from '@/utils/dates'

export function HomePage() {
  const {
    loading,
    activePeriod,
    settings,
    careers,
    allSections,
    selectedSections,
    conflicts,
    lastUpdated,
    isOnline,
    syncStatus,
    syncNow,
    coursesById,
  } = useSchedule()

  if (loading) {
    return <LoadingState label="Preparando tu panel..." />
  }

  const selectedCareer = careers.find((career) => career.id === settings?.selectedCareerId)

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-primary px-5 py-6 text-white md:px-8">
        <p className="text-sm text-white/80">Bienvenido a PoliPlan</p>
        <h2 className="mt-1 text-2xl font-bold">Tu semestre, organizado</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Consultá materias, armá tu horario semanal, detectá superposiciones y seguí tus
          exámenes incluso sin conexión.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to={ROUTES.sections}>
            <Button className="bg-white text-primary hover:bg-white/90">Buscar secciones</Button>
          </Link>
          <Link to={ROUTES.schedule}>
            <Button variant="secondary" className="border-white/20 bg-white/10 text-white">
              Ver mi horario
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Periodo académico">
          <p className="text-lg font-semibold">{activePeriod?.name ?? 'Sin periodo seleccionado'}</p>
          <p className="mt-1 text-sm text-muted">
            {activePeriod
              ? `${activePeriod.year} · Cuatrimestre ${activePeriod.term}`
              : 'Configurá un periodo en ajustes'}
          </p>
        </Card>

        <Card title="Carrera seleccionada">
          <p className="text-lg font-semibold">
            {selectedCareer?.name ?? 'Todas las carreras'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedCareer?.code ?? 'Filtrá por carrera para enfocar la búsqueda'}
          </p>
        </Card>

        <Card title="Estado de conexión">
          <div className="flex items-center gap-2">
            <Badge tone={isOnline ? 'success' : 'warning'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Badge tone="info">{syncStatus}</Badge>
          </div>
          <p className="mt-3 text-sm text-muted">
            Última actualización: {formatDateTime(lastUpdated)}
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => void syncNow(true)}>
            Buscar actualizaciones
          </Button>
        </Card>

        <Card title="Materias disponibles">
          <p className="text-3xl font-bold text-primary">{coursesById.size || allSections.length}</p>
          <p className="text-sm text-muted">Secciones visibles según tus filtros actuales</p>
        </Card>

        <Card title="Secciones elegidas">
          <p className="text-3xl font-bold text-primary">{selectedSections.length}</p>
          <p className="text-sm text-muted">Guardadas automáticamente en tu dispositivo</p>
        </Card>

        <Card title="Conflictos detectados">
          <p className="text-3xl font-bold text-danger">{conflicts.length}</p>
          <p className="text-sm text-muted">
            {conflicts.length > 0
              ? 'Revisá tu horario para resolver superposiciones'
              : 'No hay superposiciones por ahora'}
          </p>
        </Card>
      </div>
    </div>
  )
}
