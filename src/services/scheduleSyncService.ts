import { db } from '@/db/database'
import {
  createScheduleRepository,
  localScheduleRepository,
} from '@/repositories/SupabaseScheduleRepository'
import { isRemoteVersionNewer } from '@/services/versionService'
import type { SyncStatus } from '@/types/academic'

type SyncListener = (status: SyncStatus, message?: string) => void

class ScheduleSyncService {
  private status: SyncStatus = 'idle'
  private listeners = new Set<SyncListener>()
  private syncing = false
  private intervalId: number | null = null
  private repository = createScheduleRepository()

  getStatus(): SyncStatus {
    return this.status
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)
    listener(this.status)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private setStatus(status: SyncStatus, message?: string) {
    this.status = status
    for (const listener of this.listeners) {
      listener(status, message)
    }
  }

  startAutoSync(intervalMs: number) {
    this.stopAutoSync()
    this.intervalId = window.setInterval(() => {
      void this.syncActivePeriod()
    }, intervalMs)
  }

  stopAutoSync() {
    if (this.intervalId != null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async syncActivePeriod(force = false): Promise<void> {
    if (this.syncing) {
      return
    }

    this.syncing = true

    try {
      if (!navigator.onLine || import.meta.env.VITE_USE_SAMPLE_DATA === 'true') {
        this.setStatus('offline')
        await localScheduleRepository.refreshScheduleData('sample')
        return
      }

      this.setStatus('checking')
      const period = await this.repository.getActiveAcademicPeriod()
      if (!period) {
        this.setStatus('idle')
        return
      }

      const [remoteVersion, localVersionRecord] = await Promise.all([
        this.repository.getActiveScheduleVersion(period.id),
        db.localScheduleVersions.get(period.id),
      ])

      const shouldDownload =
        force ||
        isRemoteVersionNewer(
          remoteVersion,
          localVersionRecord?.version ?? null,
          localVersionRecord?.checksum ?? null,
        )

      if (!shouldDownload) {
        this.setStatus('idle')
        return
      }

      this.setStatus('downloading')
      await this.repository.refreshScheduleData(period.id)
      this.setStatus('updated', 'Datos actualizados correctamente.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido al sincronizar'
      this.setStatus('error', message)
    } finally {
      this.syncing = false
      if (this.status === 'updated') {
        window.setTimeout(() => this.setStatus('idle'), 3000)
      }
    }
  }
}

export const scheduleSyncService = new ScheduleSyncService()
