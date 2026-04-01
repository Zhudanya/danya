export const TOOL_NAME = 'ScoreReview'

export const DESCRIPTION = `Score-based code review with 100-point scoring system and quality ratchet.

Scoring: 100 points starting, CRITICAL=-30, HIGH=-10, MEDIUM=-3.
Pass: score >= 80 AND zero CRITICAL issues.
Quality ratchet: each round's score must >= previous round.

Checks architecture violations, coding conventions, logic issues, and security problems.
Engine-specific checks loaded based on detected game engine.`
