import type { BuildError } from '../types'

// javac: src/Main.java:10: error: cannot find symbol
const JAVAC_ERROR_REGEX = /^(.+?\.java):(\d+):\s+(error|warning):\s+(.+)$/

// Maven: [ERROR] /path/to/File.java:[10,5] error: ...
const MAVEN_ERROR_REGEX = /^\[ERROR\]\s+(.+?\.java):\[(\d+),(\d+)\]\s+(.+)$/

// Gradle: e: file:///path/to/File.java:10:5: error: ...
const GRADLE_ERROR_REGEX = /^e:\s+(?:file:\/\/\/)?(.+?\.java):(\d+):(\d+):\s+(.+)$/

// Test failure: Tests run: X, Failures: Y
const TEST_FAIL_REGEX = /^\[ERROR\]\s+(\S+)\s+--\s+Time elapsed:.+<<< (FAILURE|ERROR)!$/
const SUREFIRE_FAIL_REGEX = /^\[ERROR\]\s+(\S+)\((\S+)\)/

export function parseJavacOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    let match = trimmed.match(JAVAC_ERROR_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        message: match[4]!,
        severity: match[3] === 'error' ? 'error' : 'warning',
      })
      continue
    }
    match = trimmed.match(MAVEN_ERROR_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10),
        message: match[4]!,
        severity: 'error',
      })
      continue
    }
    match = trimmed.match(GRADLE_ERROR_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10),
        message: match[4]!,
        severity: 'error',
      })
    }
  }
  return errors
}

export function parseJavaTestOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    let match = trimmed.match(TEST_FAIL_REGEX)
    if (match) {
      errors.push({
        file_path: '',
        line: 0,
        message: `Test failed: ${match[1]}`,
        severity: 'error',
      })
      continue
    }
    match = trimmed.match(SUREFIRE_FAIL_REGEX)
    if (match) {
      errors.push({
        file_path: '',
        line: 0,
        message: `Test failed: ${match[1]} in ${match[2]}`,
        severity: 'error',
      })
    }
  }
  return errors
}
