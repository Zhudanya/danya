import type { BuildError } from '../types'

// Go build error: file.go:42:10: undefined: SomeType
const GO_BUILD_REGEX = /^(.+?\.go):(\d+):(\d+):\s+(.+)$/
const GO_BUILD_REGEX_NO_COL = /^(.+?\.go):(\d+):\s+(.+)$/

// golangci-lint JSON Issue
type GolangCIIssue = {
  FromLinter: string
  Text: string
  Pos: { Filename: string; Line: number; Column: number }
}

// Go test failure: --- FAIL: TestName (0.00s)
const GO_TEST_FAIL_REGEX = /^--- FAIL:\s+(\S+)/

export function parseGoBuildOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    let match = trimmed.match(GO_BUILD_REGEX)
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
    match = trimmed.match(GO_BUILD_REGEX_NO_COL)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        message: match[3]!,
        severity: 'error',
      })
    }
  }
  return errors
}

export function parseGolangCILintJSON(jsonStr: string): BuildError[] {
  try {
    const data = JSON.parse(jsonStr)
    const issues: GolangCIIssue[] = data.Issues ?? []
    return issues.map((issue) => ({
      file_path: issue.Pos.Filename,
      line: issue.Pos.Line,
      column: issue.Pos.Column,
      message: issue.Text,
      severity: 'warning' as const,
      rule: issue.FromLinter,
    }))
  } catch {
    return []
  }
}

export function parseGoTestOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(GO_TEST_FAIL_REGEX)
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
