import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const MARKER_FILENAME = 'push-approved'

export type PushApprovedData = {
  timestamp: string
  branch: string
  score: number
  reviewer: string
}

function getMarkerPath(cwd: string): string {
  return join(cwd, '.danya', MARKER_FILENAME)
}

export function createPushApprovedMarker(cwd: string, data: PushApprovedData): void {
  const path = getMarkerPath(cwd)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
}

export function consumePushApprovedMarker(cwd: string): PushApprovedData | null {
  const path = getMarkerPath(cwd)
  if (!existsSync(path)) return null

  try {
    const content = readFileSync(path, 'utf-8')
    const data = JSON.parse(content) as PushApprovedData
    unlinkSync(path) // one-time use — delete after reading
    return data
  } catch {
    return null
  }
}

export function hasPushApprovedMarker(cwd: string): boolean {
  return existsSync(getMarkerPath(cwd))
}
