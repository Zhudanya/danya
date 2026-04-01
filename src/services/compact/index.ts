export {
  shouldTriggerCompaction,
  calculateCompactionTarget,
  groupMessages,
  selectGroupsForCompaction,
  buildCompactionPrompt,
  COMPACTION_SYSTEM_PROMPT,
  DEFAULT_COMPACTION_CONFIG,
} from './compact'

export type {
  CompactionConfig,
  CompactableMessage,
  CompactionResult,
  MessageGroup,
} from './compact'
