import { createHash } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { basename } from 'node:path'
import { readFileSync } from 'node:fs'
import type { ParsedWorkbookSource } from '../types'

export class LocalFileSource {
  async load(filePath: string): Promise<ParsedWorkbookSource> {
    const buffer = readFileSync(filePath)
    const fileStat = await stat(filePath)
    const checksum = createHash('sha256').update(buffer).digest('hex')

    return {
      filePath,
      fileName: basename(filePath),
      sizeBytes: buffer.length,
      checksum,
      modifiedAt: fileStat.mtime.toISOString(),
    }
  }
}

export function stableUuid(namespace: string, key: string): string {
  const hash = createHash('sha256').update(`${namespace}:${key}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-')
}
