export async function runPrintModeStreamJsonSession(args: {
  structured: any
  query: any
  writeSdkLine: (obj: any) => void
  sessionId: string
  systemPrompt: string[]
  jsonSchema?: Record<string, unknown> | null
  context: { [k: string]: string }
  canUseTool: any
  toolUseContextBase: any
  replayUserMessages: boolean
  getTotalCostUsd: () => number
  onActiveTurnAbortControllerChanged?: (
    controller: AbortController | null,
  ) => void
  initialMessages?: any[]
}): Promise<void> {
  const { runDanyaAgentStreamJsonSession } = await import(
    '@utils/protocol/kodeAgentStreamJsonSession'
  )

  await runDanyaAgentStreamJsonSession(args as any)
}

