import { Wifi, WifiOff } from 'lucide-react'
import { useSchedule } from '@/hooks/useSchedule'

export function OnlineStatusBanner() {
  const { isOnline, wasOffline, acknowledgeReconnected } = useSchedule()

  if (isOnline && wasOffline) {
    return (
      <div
        className="border-b border-success/20 bg-success/10 px-4 py-2 text-sm text-success"
        role="status"
      >
        Conexión recuperada. Buscando actualizaciones.
        <button
          type="button"
          className="ml-3 underline"
          onClick={acknowledgeReconnected}
          aria-label="Ocultar aviso de conexión recuperada"
        >
          Entendido
        </button>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-2 border-b border-warning/20 bg-warning/10 px-4 py-2 text-sm text-warning"
        role="status"
      >
        <WifiOff className="h-4 w-4" aria-hidden="true" />
        Estás usando datos guardados en el dispositivo.
      </div>
    )
  }

  return (
    <div className="sr-only" aria-live="polite">
      <Wifi aria-hidden="true" /> Conectado
    </div>
  )
}
