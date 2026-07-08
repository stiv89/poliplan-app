import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/constants'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-sm uppercase tracking-wide text-muted">404</p>
      <h2 className="mt-2 text-2xl font-bold text-text">Página no encontrada</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        La ruta que buscás no existe. Volvé al inicio para seguir planificando tu semestre.
      </p>
      <Link to={ROUTES.home} className="mt-5">
        <Button>Ir al inicio</Button>
      </Link>
    </div>
  )
}
