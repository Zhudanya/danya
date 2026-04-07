export type PerfRule = {
  id: string
  name: string
  pattern: RegExp
  /** Hot path function names to check. null = check everywhere in file. */
  hotPaths: string[] | null
  message: string
  fix?: string
  /** If set, rule only triggers when the pair pattern is NOT found in the same file. */
  requiresPair?: { pattern: RegExp; name: string }
}

export type PerfIssue = {
  rule_id: string
  rule_name: string
  file_path: string
  line: number
  message: string
  fix?: string
}
