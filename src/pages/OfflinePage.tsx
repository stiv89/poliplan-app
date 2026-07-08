import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/config/constants'

export function OfflinePage() {
  return (
    <div className="mx-auto max-w-lg">
      <Card title="Modo sin conexión">
        <p className="text-sm text-muted">
          PoliPlan puede seguir funcionando con los datos guardados en tu dispositivo. Cuando
          vuelva internet, buscaremos actualizaciones automáticamente.
        </p>
        <Link to={ROUTES.home} className="mt-4 inline-block">
          <Button>Volver al inicio</Button>
        </Link>
      </Card>
    </div>
  )
}
