import type { MechanicalCheck } from '../mechanicalChecks'

export const GO_CHECKS: MechanicalCheck[] = [
  {
    id: 'GO-01', severity: 'HIGH', category: 'convention',
    pattern: /fmt\.Errorf\([^)]*%v/,
    fileFilter: /\.go$/,
    excludeFilter: /_test\.go$/,
    message: 'fmt.Errorf uses %v instead of %w for error wrapping',
    suggestion: 'Replace %v with %w to enable errors.Is/As unwrapping',
  },
  {
    id: 'GO-02', severity: 'HIGH', category: 'convention',
    pattern: /_\s*=\s*err\b/,
    fileFilter: /\.go$/,
    excludeFilter: /_test\.go$/,
    message: 'Error ignored with _ = err',
    suggestion: 'Handle the error or use an explicit //nolint:errcheck comment',
  },
  {
    id: 'GO-03', severity: 'HIGH', category: 'convention',
    pattern: /\bgo\s+func\s*\(/,
    fileFilter: /\.go$/,
    excludeFilter: /(safego|_test)\.go$/,
    message: 'Bare go func() — use safego.Go for panic recovery',
    suggestion: 'Replace go func() { ... }() with safego.Go(func() { ... })',
  },
  {
    id: 'GO-04', severity: 'HIGH', category: 'convention',
    pattern: /"sync\/atomic"/,
    fileFilter: /\.go$/,
    message: 'sync/atomic used instead of go.uber.org/atomic',
    suggestion: 'Use go.uber.org/atomic for safer atomic operations',
  },
  {
    id: 'GO-05', severity: 'HIGH', category: 'convention',
    pattern: /"base\/glog"/,
    fileFilter: /\.go$/,
    excludeFilter: /base\//,
    message: 'Direct base/glog import — use common/log instead',
    suggestion: 'Import common/log and use log.Infof, log.Errorf, etc.',
  },
  {
    id: 'GO-06', severity: 'CRITICAL', category: 'architecture',
    pattern: /"go\.mongodb\.org/,
    fileFilter: /\.go$/,
    excludeFilter: /db_server/,
    message: 'Direct MongoDB import outside db_server',
    suggestion: 'All DB operations must go through db_server RPC',
  },
  {
    id: 'GO-07', severity: 'CRITICAL', category: 'architecture',
    pattern: null, // Special: check cross-service internal imports
    fileFilter: /servers\/.*\/internal\//,
    message: 'Cross-service internal package import',
    suggestion: 'Services should communicate via RPC, not internal imports',
  },
  {
    id: 'GO-08', severity: 'CRITICAL', category: 'architecture',
    pattern: /".*servers\//,
    fileFilter: /common\//,
    message: 'common/ importing servers/ — wrong dependency direction',
    suggestion: 'common/ must not import from servers/. Move shared code to common/',
  },
  {
    id: 'GO-09', severity: 'HIGH', category: 'convention',
    pattern: /\btime\.Now\(\)/,
    fileFilter: /\.go$/,
    excludeFilter: /_test\.go$/,
    message: 'time.Now() used — consider mtime.NowTimeWithOffset()',
    suggestion: 'Use mtime.NowTimeWithOffset() for server-consistent time',
  },
]
