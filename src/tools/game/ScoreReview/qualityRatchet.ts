export type RatchetResult = {
  passed: boolean
  message?: string
}

export function checkRatchet(
  currentScore: number,
  previousScore: number | null,
): RatchetResult {
  if (previousScore === null) return { passed: true }
  if (currentScore >= previousScore) return { passed: true }
  return {
    passed: false,
    message: `Quality regression: ${currentScore} < ${previousScore}. Fix introduced issues and re-review.`,
  }
}
