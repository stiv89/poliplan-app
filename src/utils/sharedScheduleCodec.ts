import type { SharedScheduleSnapshot } from '@/types/sharedSchedule'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface EncodedSharedSchedulePayload {
  v: 1
  n: string
  p: string
  c: string | null
  s: string[]
}

export function isSharedScheduleUuid(ref: string): boolean {
  return UUID_RE.test(ref)
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + padding)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function encodeSharedSchedulePayload(snapshot: SharedScheduleSnapshot): string {
  const payload: EncodedSharedSchedulePayload = {
    v: 1,
    n: snapshot.name,
    p: snapshot.academicPeriodId,
    c: snapshot.selectedCareerId,
    s: snapshot.sectionIds,
  }
  return toBase64Url(JSON.stringify(payload))
}

export function decodeSharedSchedulePayload(ref: string): SharedScheduleSnapshot | null {
  try {
    const parsed = JSON.parse(fromBase64Url(ref)) as EncodedSharedSchedulePayload
    if (parsed.v !== 1 || !parsed.n || !parsed.p || !Array.isArray(parsed.s)) {
      return null
    }
    return {
      name: parsed.n,
      academicPeriodId: parsed.p,
      selectedCareerId: parsed.c ?? null,
      sectionIds: parsed.s.filter((id): id is string => typeof id === 'string' && id.length > 0),
    }
  } catch {
    return null
  }
}
