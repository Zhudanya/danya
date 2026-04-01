import type { BuildError } from '../types'

// MSBuild format: file(line,col): severity code: message
const MSBUILD_REGEX = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(CS\d+):\s+(.+)$/

// Roslyn JSON format
type RoslynOutput = {
  errors: Array<{
    severity: string
    id: string
    message: string
    line: number
    column: number
  }>
}

export function parseMSBuildOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(MSBUILD_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10),
        severity: match[4] as 'error' | 'warning',
        code: match[5]!,
        message: match[6]!,
      })
    }
  }
  return errors
}

export function parseRoslynOutput(jsonStr: string): BuildError[] {
  try {
    const output: RoslynOutput = JSON.parse(jsonStr)
    return output.errors.map((e) => ({
      file_path: '',
      line: e.line,
      column: e.column,
      severity: e.severity === 'Error' ? 'error' as const : 'warning' as const,
      code: e.id,
      message: e.message,
    }))
  } catch {
    return []
  }
}
