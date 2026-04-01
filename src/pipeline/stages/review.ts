/**
 * Stage 3: Review — call ScoreReview with quality ratchet
 */

export type ReviewStageResult = {
  score: number
  passed: boolean
  ratchet_passed: boolean
  rounds: number
}

/**
 * Build the review prompt for the LLM.
 */
export function buildReviewPrompt(round: number, previousScore?: number): string {
  let prompt = `Run the ScoreReview tool to review the current changes.

Parameters:
- mode: "standard"
- base_ref: "HEAD~1"
${previousScore !== undefined ? `- previous_score: ${previousScore}` : ''}

After review:
- If PASS (score >= 80, no CRITICAL): report success
- If FAIL: list the issues that need fixing, fix them, then re-review`

  if (round > 1) {
    prompt += `\n\nThis is review round ${round}. Fix the issues from the previous round and re-run the review.`
  }

  return prompt
}

/**
 * Check quality ratchet: current score must >= previous score.
 */
export function checkReviewRatchet(currentScore: number, previousScore: number | null): {
  passed: boolean
  message?: string
} {
  if (previousScore === null) return { passed: true }
  if (currentScore >= previousScore) return { passed: true }
  return {
    passed: false,
    message: `Quality regression: ${currentScore} < ${previousScore}. Rolling back.`,
  }
}
