import type { MechanicalCheck } from '../mechanicalChecks'

export const UNITY_CHECKS: MechanicalCheck[] = [
  {
    id: 'UC-01', severity: 'HIGH', category: 'convention',
    pattern: /\bDebug\.(Log|LogWarning|LogError)\s*\(/,
    fileFilter: /\.cs$/,
    excludeFilter: /(Editor|Test)\//,
    message: 'Debug.Log used instead of project logger',
    suggestion: 'Use MLog.Info?.Log() or project-specific logging wrapper',
  },
  {
    id: 'UC-02', severity: 'HIGH', category: 'convention',
    pattern: /async\s+Task[^A-Za-z]/,
    fileFilter: /\.cs$/,
    message: 'async Task used instead of async UniTask',
    suggestion: 'Replace System.Threading.Tasks.Task with UniTask',
  },
  {
    id: 'UC-03', severity: 'HIGH', category: 'convention',
    pattern: /Task\.Delay/,
    fileFilter: /\.cs$/,
    message: 'Task.Delay used instead of UniTask.Delay',
    suggestion: 'Replace Task.Delay with UniTask.Delay',
  },
  {
    id: 'UC-04', severity: 'HIGH', category: 'convention',
    pattern: /\bDestroy\s*\(/,
    fileFilter: /\.cs$/,
    excludeFilter: /(Editor|Test)\//,
    message: 'Destroy() used on potentially pooled object',
    suggestion: 'Use ObjectPoolUtility.Instance.Free() for pooled objects',
  },
  {
    id: 'UC-05', severity: 'MEDIUM', category: 'performance',
    pattern: /new\s+GameObject\s*\(/,
    fileFilter: /\.cs$/,
    excludeFilter: /(Editor|Test)\//,
    message: 'new GameObject() — consider object pool for frequent use',
    suggestion: 'Use ObjectPoolUtility.Instance.LoadGameObject() for high-frequency creation',
  },
  {
    id: 'UC-06', severity: 'HIGH', category: 'convention',
    pattern: null, // Special: check 3rd/ files for missing [CUSTOM_MOD]
    fileFilter: /3rd\//,
    message: 'Third-party code modified without [CUSTOM_MOD] marker',
    suggestion: 'Add // [CUSTOM_MOD] YYYY-MM-DD: reason',
  },
  {
    id: 'UC-07', severity: 'HIGH', category: 'convention',
    pattern: /using\s+System\.Threading\.Tasks/,
    fileFilter: /\.cs$/,
    message: 'System.Threading.Tasks imported — use UniTask instead',
    suggestion: 'Remove using System.Threading.Tasks, use Cysharp.Threading.Tasks',
  },
  {
    id: 'UC-08', severity: 'CRITICAL', category: 'architecture',
    pattern: /using\s+FL\.Gameplay/,
    fileFilter: /Scripts\/Framework\//,
    message: 'Layer violation: Framework importing Gameplay',
    suggestion: 'Framework layer must not reference Gameplay. Use events or interfaces.',
  },
  {
    id: 'UC-09', severity: 'HIGH', category: 'architecture',
    pattern: /using\s+FL\.Renderer/,
    fileFilter: /Scripts\/Gameplay\//,
    message: 'Layer violation: Gameplay importing Renderer',
    suggestion: 'Gameplay should not reference Renderer directly.',
  },
]
