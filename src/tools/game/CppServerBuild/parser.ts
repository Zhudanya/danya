import type { BuildError } from '../types'

// GCC/Clang: file.cpp:42:10: error: undeclared identifier 'x'
const CPP_ERROR_REGEX = /^(.+?\.(cpp|cc|cxx|c|h|hpp)):(\d+):(\d+):\s+(error|warning):\s+(.+)$/
const CPP_ERROR_NO_COL_REGEX = /^(.+?\.(cpp|cc|cxx|c|h|hpp)):(\d+):\s+(error|warning):\s+(.+)$/

// cppcheck: [file.cpp:42]: (error) Null pointer dereference
const CPPCHECK_REGEX = /^\[(.+?):(\d+)\]:\s+\((error|warning|style|performance)\)\s+(.+)$/

// ctest failure: Test #N: TestName ... Failed
const CTEST_FAIL_REGEX = /^\s*\d+\/\d+\s+Test\s+#\d+:\s+(\S+)\s+\.+\s*\*\*\*Failed/

export function parseCppBuildOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const trimmed = line.trim()
    let match = trimmed.match(CPP_ERROR_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[3]!, 10),
        column: parseInt(match[4]!, 10),
        message: match[6]!,
        severity: match[5] === 'error' ? 'error' : 'warning',
      })
      continue
    }
    match = trimmed.match(CPP_ERROR_NO_COL_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[3]!, 10),
        message: match[5]!,
        severity: match[4] === 'error' ? 'error' : 'warning',
      })
    }
  }
  return errors
}

export function parseCppCheckOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(CPPCHECK_REGEX)
    if (match) {
      errors.push({
        file_path: match[1]!,
        line: parseInt(match[2]!, 10),
        message: match[4]!,
        severity: match[3] === 'error' ? 'error' : 'warning',
        rule: 'cppcheck',
      })
    }
  }
  return errors
}

export function parseCTestOutput(output: string): BuildError[] {
  const errors: BuildError[] = []
  for (const line of output.split('\n')) {
    const match = line.trim().match(CTEST_FAIL_REGEX)
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
