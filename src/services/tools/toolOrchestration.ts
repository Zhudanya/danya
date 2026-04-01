/**
 * Tool Orchestration Engine
 * Ported from Codex's services/tools/toolOrchestration.ts, adapted for Danya.
 *
 * Manages concurrent execution of multiple tool calls in a single turn:
 * - Partitions tools into read-only (parallel) and write (serial) batches
 * - Executes read-only batch concurrently (max DEFAULT_PARALLEL_LIMIT)
 * - Executes write batch serially to prevent conflicts
 * - Queues context mutations and applies atomically after batch
 */

import type { Tool, ToolUseContext } from '@tool'
import { isToolParallelSafe, partitionToolCalls } from '@tool'
import { executeToolUse, type ToolExecutionResult, type ToolExecutionOptions } from './toolExecution'

const DEFAULT_PARALLEL_LIMIT = 10

export type ToolCall = {
  toolUseId: string
  tool: Tool
  input: Record<string, unknown>
}

export type ToolCallResult = {
  toolUseId: string
  toolName: string
  result: ToolExecutionResult
}

export type OrchestrationResult = {
  results: ToolCallResult[]
  contextModifiers: Array<{
    modifyContext: (ctx: ToolUseContext) => ToolUseContext
  }>
}

/**
 * Execute multiple tool calls with intelligent partitioning.
 *
 * Algorithm:
 * 1. Partition calls into parallel-safe and serial
 * 2. Execute parallel batch concurrently (up to limit)
 * 3. Execute serial batch one-by-one
 * 4. Collect all context modifiers for atomic application
 */
export async function runToolCalls(
  calls: ToolCall[],
  context: ToolUseContext,
  options: ToolExecutionOptions = {},
): Promise<OrchestrationResult> {
  if (calls.length === 0) {
    return { results: [], contextModifiers: [] }
  }

  // Single call — just run it directly
  if (calls.length === 1) {
    const call = calls[0]!
    const result = await executeToolUse(call.tool, call.input, context, options)
    const contextModifiers = result.contextModifier ? [result.contextModifier] : []
    return {
      results: [{ toolUseId: call.toolUseId, toolName: call.tool.name, result }],
      contextModifiers,
    }
  }

  // Partition into parallel-safe and serial
  const { parallel, serial } = partitionToolCalls(
    calls.map((c) => ({ ...c, tool: c.tool, input: c.input })),
  )

  const allResults: ToolCallResult[] = []
  const contextModifiers: OrchestrationResult['contextModifiers'] = []

  // ── Execute parallel batch ───────────────────────
  if (parallel.length > 0) {
    const parallelResults = await executeParallelBatch(
      parallel.map((p) => ({
        toolUseId: (p as any).toolUseId,
        tool: p.tool,
        input: p.input as Record<string, unknown>,
      })),
      context,
      options,
    )

    for (const r of parallelResults) {
      allResults.push(r)
      if (r.result.contextModifier) {
        contextModifiers.push(r.result.contextModifier)
      }
    }
  }

  // ── Execute serial batch ─────────────────────────
  // Apply accumulated context modifiers before serial execution
  let currentContext = context
  for (const modifier of contextModifiers) {
    currentContext = modifier.modifyContext(currentContext)
  }

  for (const call of serial) {
    const serialCall = call as unknown as ToolCall
    const result = await executeToolUse(
      serialCall.tool,
      serialCall.input,
      currentContext,
      options,
    )

    allResults.push({
      toolUseId: serialCall.toolUseId,
      toolName: serialCall.tool.name,
      result,
    })

    // Apply context modifier immediately for serial execution
    if (result.contextModifier) {
      currentContext = result.contextModifier.modifyContext(currentContext)
      contextModifiers.push(result.contextModifier)
    }
  }

  return { results: allResults, contextModifiers }
}

/**
 * Execute a batch of tools concurrently with a parallelism limit.
 */
async function executeParallelBatch(
  calls: ToolCall[],
  context: ToolUseContext,
  options: ToolExecutionOptions,
): Promise<ToolCallResult[]> {
  const results: ToolCallResult[] = []

  // Execute in chunks of DEFAULT_PARALLEL_LIMIT
  for (let i = 0; i < calls.length; i += DEFAULT_PARALLEL_LIMIT) {
    const chunk = calls.slice(i, i + DEFAULT_PARALLEL_LIMIT)

    const chunkResults = await Promise.all(
      chunk.map(async (call) => {
        const result = await executeToolUse(call.tool, call.input, context, options)
        return {
          toolUseId: call.toolUseId,
          toolName: call.tool.name,
          result,
        }
      }),
    )

    results.push(...chunkResults)
  }

  return results
}

export { executeToolUse } from './toolExecution'
