const SYNC_PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const NOTIFICATION_PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

export function shouldShowSyncPrompt(dismissedAt: string | null): boolean {
  if (!dismissedAt) return true
  return Date.now() - new Date(dismissedAt).getTime() > SYNC_PROMPT_COOLDOWN_MS
}

export function shouldShowNotificationPrompt(dismissedAt: string | null): boolean {
  if (!dismissedAt) return true
  return Date.now() - new Date(dismissedAt).getTime() > NOTIFICATION_PROMPT_COOLDOWN_MS
}

export function canRequestBrowserNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function browserNotificationsPending(): boolean {
  return canRequestBrowserNotifications() && Notification.permission === 'default'
}
