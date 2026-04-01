export const TOOL_NAME = 'KnowledgeSediment'

export const DESCRIPTION = `Automatically sediment knowledge (features, bug fixes, research) to the project's Docs/ directory.

Runs automatically after task completion. Creates structured documentation:
- feature → Docs/Version/<version>/<title>/summary.md
- bugfix  → Docs/Bugs/<version>/<title>.md
- research → Docs/Engine/Research/<title>/findings.md`
