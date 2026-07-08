import type { ScheduleVersion } from '@/types/academic'

export function isRemoteVersionNewer(
  remote: ScheduleVersion | null,
  localVersion: number | null,
  localChecksum: string | null,
): boolean {
  if (!remote) {
    return false
  }

  if (localVersion == null) {
    return true
  }

  if (remote.version > localVersion) {
    return true
  }

  if (
    remote.version === localVersion &&
    remote.sourceChecksum &&
    remote.sourceChecksum !== localChecksum
  ) {
    return true
  }

  return false
}

export function compareVersions(
  left: number | null | undefined,
  right: number | null | undefined,
): number {
  const safeLeft = left ?? 0
  const safeRight = right ?? 0
  return safeLeft - safeRight
}
