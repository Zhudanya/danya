/**
 * Shared types for game-specific tools.
 */

export type BuildError = {
  file_path: string
  line: number
  column?: number
  code?: string
  message: string
  severity: 'error' | 'warning'
  rule?: string
}

export type BuildStageResult = {
  name: string
  success: boolean
  errors: BuildError[]
  duration_ms: number
}
