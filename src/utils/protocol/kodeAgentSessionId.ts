import { randomUUID } from 'crypto'

let currentSessionId: string = randomUUID()

export function setDanyaAgentSessionId(nextSessionId: string): void {
  currentSessionId = nextSessionId
}

export function resetDanyaAgentSessionIdForTests(): void {
  currentSessionId = randomUUID()
}

export function getDanyaAgentSessionId(): string {
  return currentSessionId
}

export { setDanyaAgentSessionId as setKodeAgentSessionId, getDanyaAgentSessionId as getKodeAgentSessionId, resetDanyaAgentSessionIdForTests as resetKodeAgentSessionIdForTests }
