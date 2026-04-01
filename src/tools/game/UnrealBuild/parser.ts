import type { BuildError } from '../types'

// MSVC format: file.cpp(42): error C2065: 'x': undeclared identifier
const MSVC_REGEX = /^(.+?)\((\d+)\):\s+(error|warning)\s+(C\d+):\s+(.+)$/

// Clang format: file.cpp:42:10: error: use of undeclared identifier 'x'
const CLANG_REGEX = /^(.+?):(\d+):(\d+):\s+(error|warning):\s+(.+)$/

// UE-specific format: LogCompile: Error: file.cpp(42): message
const UE_LOG_REGEX = /^.+?:\s+(Error|Warning):\s+(.+?)\((\d+)\):\s+(.+)$/

export function parseUnrealBuildOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const trimmed = line.trim()

    // Try MSVC format first
    let match = trimmed.match(MSVC_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        severity: match[3] as 'error' | 'warning',
        code: match[4]!,
        message: match[5]!,
      })
      continue
    }

    // Try Clang format
    match = trimmed.match(CLANG_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10),
        severity: match[4] as 'error' | 'warning',
        message: match[5]!,
      })
      continue
    }

    // Try UE log format
    match = trimmed.match(UE_LOG_REGEX)
    if (match) {
      errors.push({
        file_path: match[2]!,
        line: parseInt(match[3]!, 10),
        severity: match[1]!.toLowerCase() as 'error' | 'warning',
        message: match[4]!,
      })
    }
  }
  return errors
}
