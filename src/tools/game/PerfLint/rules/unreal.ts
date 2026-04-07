import type { PerfRule } from '../types'

export const unrealRules: PerfRule[] = [
  {
    id: 'UE-PERF-01',
    name: 'FindActor in Tick',
    pattern: /\b(?:FindActor|GetAllActorsOfClass|GetAllActorsWithTag)\s*[<(]/,
    hotPaths: ['Tick', 'TickComponent'],
    message: 'FindActor/GetAllActorsOfClass in Tick is expensive — cache at BeginPlay',
  },
  {
    id: 'UE-PERF-02',
    name: 'FString concatenation in Tick',
    pattern: /FString\s*(?:\+|::Printf|::Format)/,
    hotPaths: ['Tick', 'TickComponent'],
    message: 'FString operations in Tick create allocations — use FName or pre-built strings',
  },
  {
    id: 'UE-PERF-03',
    name: 'NewObject/SpawnActor in Tick',
    pattern: /\b(?:NewObject|SpawnActor|CreateDefaultSubobject)\s*[<(]/,
    hotPaths: ['Tick', 'TickComponent'],
    message: 'Object creation in Tick causes GC pressure — use object pool or pre-spawn',
  },
  {
    id: 'UE-PERF-04',
    name: 'Cast in Tick',
    pattern: /\b(?:Cast|CastChecked)\s*</,
    hotPaths: ['Tick', 'TickComponent'],
    message: 'Cast<T> in Tick every frame — cache the cast result at BeginPlay',
  },
  {
    id: 'UE-PERF-05',
    name: 'GetComponentByClass in Tick',
    pattern: /\b(?:GetComponentByClass|FindComponentByClass)\s*[<(]/,
    hotPaths: ['Tick', 'TickComponent'],
    message: 'GetComponentByClass in Tick — cache at BeginPlay',
  },
  {
    id: 'UE-PERF-06',
    name: 'LineTrace every Tick',
    pattern: /\b(?:LineTraceSingleByChannel|LineTraceMultiByChannel|SweepSingleByChannel)\s*\(/,
    hotPaths: ['Tick', 'TickComponent'],
    message: 'Line trace every Tick can be expensive — consider reducing frequency or using async trace',
  },
]
