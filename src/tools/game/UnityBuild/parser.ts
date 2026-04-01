import type { BuildError } from '../types'

// Unity log format: Assets/Scripts/Foo.cs(42,10): error CS1002: ; expected
// Reuses MSBuild regex pattern — Unity compiler output is MSBuild-compatible
const UNITY_LOG_REGEX = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(CS\d+):\s+(.+)$/

export function parseUnityLogOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(UNITY_LOG_REGEX)
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
