export const TOOL_NAME = 'GateChain'

export const DESCRIPTION = `Run the full quality gate chain: verify → commit → review → push.
Chains other tools in sequence. Stops at the first failed gate.
Use skip_push=true (default) to stop after review without pushing.`
