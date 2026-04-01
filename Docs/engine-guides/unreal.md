# Unreal Engine Setup Guide

## Detection
Danya auto-detects UE projects by finding `*.uproject` files.

## Build Tools
- **UnrealBuild** — Invokes UBT, parses MSVC/Clang error output

## Review Checks (UE-01 to UE-06)
| ID | Check | Severity |
|----|-------|----------|
| UE-01 | Raw new on UObject types | HIGH |
| UE-02 | UObject* without UPROPERTY() | HIGH |
| UE-03 | printf/cout instead of UE_LOG | HIGH |
| UE-04 | std::thread instead of FRunnable | HIGH |
| UE-05 | Missing GENERATED_BODY() | CRITICAL |
| UE-06 | Raw delete | MEDIUM |
