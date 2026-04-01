export const UNREAL_ENGINE_KNOWLEDGE = `
# Engine Knowledge: Unreal Engine

## Lifecycle
- AActor: Constructor → PostInitializeComponents → BeginPlay → Tick → EndPlay → BeginDestroy
- UActorComponent: InitializeComponent → BeginPlay → TickComponent → EndPlay → DestroyComponent
- Use BeginPlay for runtime initialization, not constructors (constructors run during CDO creation).

## GAS (Gameplay Ability System)
- Abilities (UGameplayAbility): define what a character can do.
- Effects (UGameplayEffect): modify attributes, apply buffs/debuffs.
- Attributes (UAttributeSet): numeric properties (health, damage, speed).

## Blueprint / C++ Interop
- Performance-sensitive logic in C++, expose to Blueprint via UFUNCTION(BlueprintCallable).
- Designer-tunable parameters via UPROPERTY(EditAnywhere, BlueprintReadWrite).

## Memory Management
- UObject references MUST be marked with UPROPERTY() to prevent premature GC.
- Non-UObject: use TSharedPtr / TWeakPtr / TUniquePtr. Avoid raw new/delete.
- Use NewObject<T>(), CreateDefaultSubobject<T>(), SpawnActor<T>() instead of raw new.

## Networking & Replication
- Property replication: mark with UPROPERTY(Replicated) + GetLifetimeReplicatedProps.
- RPC types: Server (client→server), Client (server→client), NetMulticast.
`

export const UNREAL_CODING_CONVENTIONS = `
# Engine Conventions: Unreal Engine

## Naming Prefixes
- F: Struct, U: UObject, A: AActor, E: Enum, I: Interface, T: Template, b: Boolean

## Macros
- UPROPERTY(): required for GC, serialization, replication, editor.
- UFUNCTION(): required for Blueprint access, RPC.
- GENERATED_BODY(): must appear in every reflected class/struct.

## Logging
- Use UE_LOG with category and verbosity. Never use printf / std::cout.

## Error Handling
- check(): programming errors (crashes). ensure(): recoverable (logs, continues).

## Memory
- UObject references: always UPROPERTY(). Use TWeakObjectPtr for non-owning.
- Containers: TArray, TMap, TSet. Prefer over std:: containers.
`

export const UNREAL_PITFALLS = `
# Engine Pitfalls: Unreal Engine

- Missing UPROPERTY: Raw UObject* → GC collects → dangling pointer → crash.
- CDO constructor: World doesn't exist yet. Use BeginPlay for world-dependent init.
- Hot reload: Adding/removing UPROPERTY fields with hot reload = corrupted state. Full rebuild needed.
- Replication timing: Replicated properties arrive async. Don't assume initialization sequence.
- GC non-deterministic: Don't rely on destructor timing for gameplay logic.
`

export function getUnrealVariantPrompt(): string {
  return [
    UNREAL_ENGINE_KNOWLEDGE,
    UNREAL_CODING_CONVENTIONS,
    UNREAL_PITFALLS,
  ].join('\n')
}
