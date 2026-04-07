import type { PerfRule } from '../types'

export const godotRules: PerfRule[] = [
  {
    id: 'GD-PERF-01',
    name: 'get_node in _process',
    pattern: /\bget_node\s*\(/,
    hotPaths: ['_process', '_physics_process'],
    message: 'get_node() in _process — cache with @onready or in _ready()',
    fix: '@onready var node = $NodePath',
  },
  {
    id: 'GD-PERF-02',
    name: 'instance() in _process',
    pattern: /\b(?:instance|instantiate)\s*\(/,
    hotPaths: ['_process', '_physics_process'],
    message: 'instantiate() in _process loop — use object pool',
  },
  {
    id: 'GD-PERF-03',
    name: 'Signal connect without disconnect',
    pattern: /\.connect\s*\(/,
    hotPaths: null, // Check file-wide
    message: 'Signal connected — ensure corresponding disconnect() exists to prevent leaks',
    requiresPair: { pattern: /\.disconnect\s*\(/, name: 'disconnect' },
  },
  {
    id: 'GD-PERF-04',
    name: 'get_children in _process',
    pattern: /\bget_children\s*\(/,
    hotPaths: ['_process', '_physics_process'],
    message: 'get_children() allocates array every call — cache the result',
  },
  {
    id: 'GD-PERF-05',
    name: 'String format in _process',
    pattern: /(?:str\s*\(|%\s+["\w]|\bformat\s*\()/,
    hotPaths: ['_process', '_physics_process'],
    message: 'String formatting in _process creates garbage — cache formatted strings',
  },
]
