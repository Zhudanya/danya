import type { BuildError } from '../types'

// TypeScript: src/game.ts(10,5): error TS2304: Cannot find name 'x'.
const TSC_ERROR_REGEX = /^(.+?\.tsx?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/

// ESLint unix format: /path/to/file.ts:10:5: message [Error/rule-name]
const ESLINT_REGEX = /^(.+?):(\d+):(\d+):\s+(.+?)\s+\[(Error|Warning)\/(.+?)\]$/

// Jest/Vitest: FAIL src/game.test.ts
const TEST_FAIL_REGEX = /^FAIL\s+(.+)$/
// Test suite specific: ● TestName > should do something
const TEST_CASE_FAIL_REGEX = /^\s+●\s+(.+)$/

export function parseTscOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(TSC_ERROR_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10),
        message: match[6]!,
        severity: match[4] === 'error' ? 'error' : 'warning',
        code: match[5],
      })
    }
  }
  return errors
}

export function parseEslintOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(ESLINT_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        column: parseInt(match[3]!, 10),
        message: match[4]!,
        severity: match[5] === 'Error' ? 'error' : 'warning',
        rule: match[6],
      })
    }
  }
  return errors
}

export function parseNodeTestOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    let match = line.trim().match(TEST_FAIL_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: 0,
        message: `Test suite failed: ${match[1]}`,
        severity: 'error',
      })
      continue
    }
    match = line.match(TEST_CASE_FAIL_REGEX)
    if (match) {
      errors.push({
        file_path: '',
        line: 0,
        message: `Test failed: ${match[1]}`,
        severity: 'error',
      })
    }
  }
  return errors
}
