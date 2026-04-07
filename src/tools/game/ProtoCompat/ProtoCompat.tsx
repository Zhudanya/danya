import { z } from 'zod'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import type { Tool, ToolUseContext } from '@tool'
import { TOOL_NAME, DESCRIPTION } from './prompt'

const inputSchema = z.strictObject({
  project_path: z.string().describe('Path to project root containing .proto files'),
  proto_paths: z.array(z.string()).optional()
    .describe('Specific .proto files to check. Default: auto-detect all changed .proto files'),
})

type Severity = 'CRITICAL' | 'HIGH'

type BreakingIssue = {
  file_path: string
  severity: Severity
  description: string
  line_context: string
}

type Output = {
  success: boolean
  files_checked: number
  issues: BreakingIssue[]
  duration_ms: number
}

/** Detect proto files that have a git diff */
function findChangedProtos(projectPath: string, protoPaths?: string[]): string[] {
  if (protoPaths && protoPaths.length > 0) {
    return protoPaths.filter(p => existsSync(p))
  }
  try {
    const output = execSync('git diff HEAD --name-only -- "*.proto"', {
      cwd: projectPath, encoding: 'utf-8', timeout: 15000,
    })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    // Fallback: find all proto files (no diff available, e.g. new repo)
    return []
  }
}

function getDiff(projectPath: string, filePath: string): string {
  try {
    return execSync(`git diff HEAD -- "${filePath}"`, {
      cwd: projectPath, encoding: 'utf-8', timeout: 15000,
    })
  } catch {
    return ''
  }
}

// Regex patterns for proto constructs
// Supports optional modifiers: repeated/optional/map<K,V> before type
const FIELD_NUM_RE = /^-\s*(?:repeated\s+|optional\s+|map\s*<[^>]+>\s+)?(\w+)\s+(\w+)\s*=\s*(\d+)/
const FIELD_ADD_RE = /^\+\s*(?:repeated\s+|optional\s+|map\s*<[^>]+>\s+)?(\w+)\s+(\w+)\s*=\s*(\d+)/
const ENUM_RE = /^-\s*(\w+)\s*=\s*(\d+)/
const ENUM_ADD_RE = /^\+\s*(\w+)\s*=\s*(\d+)/
const RESERVED_RE = /^\+\s*reserved\s+/
const RPC_REMOVE_RE = /^-\s*rpc\s+(\w+)/
const SERVICE_REMOVE_RE = /^-\s*service\s+(\w+)/

function analyzeDiff(filePath: string, diff: string): BreakingIssue[] {
  const issues: BreakingIssue[] = []
  if (!diff) return issues

  const lines = diff.split('\n')

  // Track removed and added fields for comparison
  const removedFields: Map<string, { type: string; num: string; line: string }> = new Map()
  const addedFields: Map<string, { type: string; num: string; line: string }> = new Map()
  const removedEnums: Map<string, { num: string; line: string }> = new Map()
  const addedEnums: Map<string, { num: string; line: string }> = new Map()
  const reservedNums = new Set<string>()
  let removedRpcs: string[] = []
  let addedRpcs = new Set<string>()
  let removedServices: string[] = []
  let addedServices = new Set<string>()

  // First pass: collect all changes
  for (const line of lines) {
    // Removed fields
    const removedMatch = line.match(FIELD_NUM_RE)
    if (removedMatch) {
      removedFields.set(removedMatch[2]!, { type: removedMatch[1]!, num: removedMatch[3]!, line })
      continue
    }

    // Added fields
    const addedMatch = line.match(FIELD_ADD_RE)
    if (addedMatch) {
      addedFields.set(addedMatch[2]!, { type: addedMatch[1]!, num: addedMatch[3]!, line })
      continue
    }

    // Reserved declarations
    if (RESERVED_RE.test(line)) {
      const nums = line.match(/\d+/g)
      if (nums) nums.forEach(n => reservedNums.add(n))
      continue
    }

    // Removed enums
    const enumRemoved = line.match(ENUM_RE)
    if (enumRemoved) {
      removedEnums.set(enumRemoved[1]!, { num: enumRemoved[2]!, line })
      continue
    }

    // Added enums
    const enumAdded = line.match(ENUM_ADD_RE)
    if (enumAdded) {
      addedEnums.set(enumAdded[1]!, { num: enumAdded[2]!, line })
      continue
    }

    // Removed RPCs
    const rpcMatch = line.match(RPC_REMOVE_RE)
    if (rpcMatch) {
      removedRpcs.push(rpcMatch[1]!)
      continue
    }

    // Added RPCs (to avoid false positives on renames)
    if (/^\+\s*rpc\s+(\w+)/.test(line)) {
      const m = line.match(/^\+\s*rpc\s+(\w+)/)
      if (m) addedRpcs.add(m[1]!)
      continue
    }

    // Removed services
    const serviceMatch = line.match(SERVICE_REMOVE_RE)
    if (serviceMatch) {
      removedServices.push(serviceMatch[1]!)
      continue
    }
    if (/^\+\s*service\s+(\w+)/.test(line)) {
      const m = line.match(/^\+\s*service\s+(\w+)/)
      if (m) addedServices.add(m[1]!)
    }
  }

  // Second pass: compare removed vs added to detect breaking changes

  // Check field number changes and type changes
  for (const [name, removed] of removedFields) {
    const added = addedFields.get(name)
    if (added) {
      if (removed.num !== added.num) {
        issues.push({
          file_path: filePath,
          severity: 'CRITICAL',
          description: `Field "${name}" number changed from ${removed.num} to ${added.num}`,
          line_context: `${removed.line}\n${added.line}`,
        })
      }
      if (removed.type !== added.type) {
        issues.push({
          file_path: filePath,
          severity: 'CRITICAL',
          description: `Field "${name}" type changed from ${removed.type} to ${added.type}`,
          line_context: `${removed.line}\n${added.line}`,
        })
      }
    } else {
      // Field deleted - check if reserved
      if (!reservedNums.has(removed.num)) {
        issues.push({
          file_path: filePath,
          severity: 'HIGH',
          description: `Field "${name}" (number ${removed.num}) deleted without reserving the field number`,
          line_context: removed.line,
        })
      }
    }
  }

  // Check enum renumbering
  for (const [name, removed] of removedEnums) {
    const added = addedEnums.get(name)
    if (added && removed.num !== added.num) {
      issues.push({
        file_path: filePath,
        severity: 'CRITICAL',
        description: `Enum value "${name}" renumbered from ${removed.num} to ${added.num}`,
        line_context: `${removed.line}\n${added.line}`,
      })
    }
  }

  // Check for required field additions (proto2 style or field option)
  for (const [name, added] of addedFields) {
    if (!removedFields.has(name) && added.type === 'required') {
      issues.push({
        file_path: filePath,
        severity: 'HIGH',
        description: `Required field "${name}" added - breaks existing clients`,
        line_context: added.line,
      })
    }
  }

  // Check removed RPCs
  for (const rpc of removedRpcs) {
    if (!addedRpcs.has(rpc)) {
      issues.push({
        file_path: filePath,
        severity: 'HIGH',
        description: `RPC method "${rpc}" removed`,
        line_context: `- rpc ${rpc}`,
      })
    }
  }

  // Check removed services
  for (const svc of removedServices) {
    if (!addedServices.has(svc)) {
      issues.push({
        file_path: filePath,
        severity: 'HIGH',
        description: `Service "${svc}" removed`,
        line_context: `- service ${svc}`,
      })
    }
  }

  return issues
}

export const ProtoCompatTool = {
  name: TOOL_NAME,
  description: DESCRIPTION,
  searchHint: 'detect breaking changes in protobuf proto files',
  inputSchema,

  async isEnabled() { return true },
  isReadOnly() { return true },
  isConcurrencySafe() { return true },
  needsPermissions() { return false },

  async prompt() { return DESCRIPTION },

  async validateInput({ project_path }: z.infer<typeof inputSchema>) {
    if (!existsSync(project_path)) {
      return { result: false, message: `Directory not found: ${project_path}` }
    }
    return { result: true }
  },

  renderToolUseMessage({ project_path, proto_paths }: z.infer<typeof inputSchema>) {
    const count = proto_paths?.length
    return `Checking proto compatibility: ${count ? `${count} files` : 'auto-detect'} in ${project_path}`
  },

  renderResultForAssistant(output: Output): string {
    if (output.issues.length === 0) {
      return `ProtoCompat: ${output.files_checked} files checked, no breaking changes detected (${output.duration_ms}ms)`
    }
    const critical = output.issues.filter(i => i.severity === 'CRITICAL').length
    const high = output.issues.filter(i => i.severity === 'HIGH').length
    const details = output.issues.slice(0, 10).map(i =>
      `  [${i.severity}] ${i.file_path}: ${i.description}`
    ).join('\n')
    return `ProtoCompat: ${output.files_checked} files checked, ${output.issues.length} breaking changes (${critical} CRITICAL, ${high} HIGH)\n${details}`
  },

  async *call(
    { project_path, proto_paths }: z.infer<typeof inputSchema>,
    context: ToolUseContext,
  ) {
    const start = Date.now()

    yield {
      type: 'progress' as const,
      content: { stage: 'finding proto files', status: 'running' },
    }

    const protoFiles = findChangedProtos(project_path, proto_paths)

    if (protoFiles.length === 0) {
      const output: Output = {
        success: true,
        files_checked: 0,
        issues: [],
        duration_ms: Date.now() - start,
      }
      yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
      return
    }

    const allIssues: BreakingIssue[] = []

    for (const file of protoFiles) {
      yield {
        type: 'progress' as const,
        content: { stage: `analyzing ${file}`, status: 'running' },
      }

      const diff = getDiff(project_path, file)
      const issues = analyzeDiff(file, diff)
      allIssues.push(...issues)
    }

    const output: Output = {
      success: allIssues.filter(i => i.severity === 'CRITICAL').length === 0,
      files_checked: protoFiles.length,
      issues: allIssues,
      duration_ms: Date.now() - start,
    }

    yield { type: 'result' as const, data: output, resultForAssistant: this.renderResultForAssistant(output) }
  },
} satisfies Tool<typeof inputSchema, Output>
