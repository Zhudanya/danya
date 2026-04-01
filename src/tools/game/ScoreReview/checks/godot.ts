import type { MechanicalCheck } from '../mechanicalChecks'

export const GODOT_CHECKS: MechanicalCheck[] = [
  {
    id: 'GD-01', severity: 'MEDIUM', category: 'convention',
    pattern: /func\s+\w+\([^:)]+\)\s*:/,
    fileFilter: /\.gd$/,
    message: 'Missing type hints on function parameters',
    suggestion: 'Add type hints: func method(param: Type) -> ReturnType:',
  },
  {
    id: 'GD-02', severity: 'MEDIUM', category: 'convention',
    pattern: /\bprint\s*\(/,
    fileFilter: /\.gd$/,
    excludeFilter: /debug\//,
    message: 'print() left in non-debug code',
    suggestion: 'Remove print() or use a debug logger',
  },
  {
    id: 'GD-03', severity: 'HIGH', category: 'convention',
    pattern: /\byield\b/,
    fileFilter: /\.gd$/,
    message: 'yield is deprecated in Godot 4 — use await',
    suggestion: 'Replace yield with await',
  },
  {
    id: 'GD-04', severity: 'HIGH', category: 'performance',
    pattern: /(velocity|move_and_slide)/,
    fileFilter: /\.gd$/,
    message: 'Movement logic possibly in _process instead of _physics_process',
    suggestion: 'Move physics-related code to _physics_process for frame-rate independence',
  },
  {
    id: 'GD-05', severity: 'MEDIUM', category: 'convention',
    pattern: null, // Special: check for missing class_name in shared scripts
    fileFilter: /(component|shared|util)\//,
    message: 'Missing class_name on reusable script',
    suggestion: 'Add class_name at top of script for global type registration',
  },
]
