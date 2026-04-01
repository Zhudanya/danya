import type { MechanicalCheck } from '../mechanicalChecks'

export const UNREAL_CHECKS: MechanicalCheck[] = [
  {
    id: 'UE-01', severity: 'HIGH', category: 'convention',
    pattern: /\bnew\s+[A-Z]\w+[^(]*;/,
    fileFilter: /\.(cpp|h)$/,
    message: 'Raw new on potential UObject — use NewObject<T>()',
    suggestion: 'Use NewObject<T>(), CreateDefaultSubobject<T>(), or SpawnActor<T>()',
  },
  {
    id: 'UE-02', severity: 'HIGH', category: 'convention',
    pattern: /\bU[A-Z]\w+\s*\*/,
    fileFilter: /\.(h|hpp)$/,
    message: 'UObject* without UPROPERTY() may be GC-collected',
    suggestion: 'Mark UObject references with UPROPERTY() to prevent GC',
  },
  {
    id: 'UE-03', severity: 'HIGH', category: 'convention',
    pattern: /\b(printf|std::cout|OutputDebugString)\b/,
    fileFilter: /\.(cpp|h)$/,
    message: 'Raw print used instead of UE_LOG',
    suggestion: 'Use UE_LOG(LogGame, Warning, TEXT("message"))',
  },
  {
    id: 'UE-04', severity: 'HIGH', category: 'convention',
    pattern: /\b(std::thread|std::async)\b/,
    fileFilter: /\.(cpp|h)$/,
    message: 'std::thread/async used instead of FRunnable/AsyncTask',
    suggestion: 'Use FRunnable, FAsyncTask, or AsyncTask(ENamedThreads::...)',
  },
  {
    id: 'UE-05', severity: 'CRITICAL', category: 'convention',
    pattern: /class\s+\w+\s*:\s*public\s+(AActor|UActorComponent|UObject)/,
    fileFilter: /\.(h|hpp)$/,
    message: 'Reflected class may be missing GENERATED_BODY()',
    suggestion: 'Ensure GENERATED_BODY() is present inside UCLASS/USTRUCT',
  },
  {
    id: 'UE-06', severity: 'MEDIUM', category: 'convention',
    pattern: /\bdelete\s+/,
    fileFilter: /\.(cpp|h)$/,
    message: 'Raw delete — UObjects are GC-managed',
    suggestion: 'Let GC handle UObject cleanup. Use TSharedPtr for non-UObjects.',
  },
]
