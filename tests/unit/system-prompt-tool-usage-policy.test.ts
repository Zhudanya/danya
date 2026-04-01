import { describe, expect, test } from 'bun:test'
import { getSystemPrompt } from '@constants/prompts'

describe('System prompt tool usage policy (Reference CLI parity)', () => {
  test('encourages parallel only when independent (no placeholders)', async () => {
    const parts = await getSystemPrompt()
    const prompt = parts.join('\n')

    expect(prompt).toContain(
      'You can call multiple tools in a single response. Make independent calls in parallel.',
    )
    expect(prompt).toContain(
      'Call multiple tools in a single response when possible. If tools have no dependencies, call them in parallel.',
    )
    expect(prompt).not.toContain(
      'When making multiple bash tool calls, you MUST send a single message with multiple tools calls to run the calls in parallel.',
    )
  })
})
