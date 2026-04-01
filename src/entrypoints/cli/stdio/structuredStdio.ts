import { DanyaAgentStructuredStdio } from '@utils/protocol/kodeAgentStructuredStdio'

export function createPrintModeStructuredStdio(args: {
  enabled: boolean
  stdin: any
  stdout: any
  onInterrupt: () => void
  onControlRequest: (msg: any) => Promise<any>
}): DanyaAgentStructuredStdio | null {
  if (!args.enabled) return null

  return new DanyaAgentStructuredStdio(args.stdin, args.stdout, {
    onInterrupt: args.onInterrupt,
    onControlRequest: args.onControlRequest,
  })
}

