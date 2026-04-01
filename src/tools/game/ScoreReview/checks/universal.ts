import type { MechanicalCheck } from '../mechanicalChecks'

export const UNIVERSAL_CHECKS: MechanicalCheck[] = [
  {
    id: 'U-01', severity: 'CRITICAL', category: 'architecture',
    pattern: null, // Handled by ArchitectureGuard forbidden zone check
    fileFilter: /.*/,
    message: 'Forbidden zone edit detected',
    suggestion: 'Edit the source file and regenerate, or use a WORKAROUND',
  },
  {
    id: 'U-02', severity: 'CRITICAL', category: 'security',
    pattern: /(password|api[_-]?key|secret|token)\s*[:=]\s*["'][a-zA-Z0-9]/i,
    fileFilter: /\.(ts|tsx|js|go|cs|cpp|h|gd|py)$/,
    excludeFilter: /\.(test|spec|mock|fixture)\./,
    message: 'Possible hardcoded secret/credential',
    suggestion: 'Use environment variables or a secrets manager',
  },
  {
    id: 'U-03', severity: 'MEDIUM', category: 'convention',
    pattern: /\b(TODO|FIXME|HACK|XXX)\b:/,
    fileFilter: /\.(ts|tsx|js|go|cs|cpp|h|gd|py)$/,
    excludeFilter: /\.(test|spec)\./,
    message: 'Debug/temp marker left in code',
    suggestion: 'Resolve or remove before committing',
  },
  {
    id: 'U-04', severity: 'MEDIUM', category: 'convention',
    pattern: null, // Checked at file level (line count > 500 changed)
    fileFilter: /.*/,
    message: 'Large file change (>500 lines)',
    suggestion: 'Consider decomposing into smaller changes',
  },
]
