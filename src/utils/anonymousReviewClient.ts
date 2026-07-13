const STORAGE_KEY = 'poliplan:anon-review-client-id'

export function getAnonymousReviewClientId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing && existing.length >= 8) return existing

    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}
