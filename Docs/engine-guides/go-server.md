# Go Game Server Setup Guide

## Detection
Danya auto-detects Go servers by finding `go.mod` or `Makefile` with `go build`.

## Build Tools
- **GameServerBuild** — 3 levels: quick (lint), build (lint+compile), full (lint+compile+test)
- **OrmGenerate** — Invoke `make orm` for ORM code generation

## Review Checks (GO-01 to GO-09)
| ID | Check | Severity |
|----|-------|----------|
| GO-01 | fmt.Errorf %v instead of %w | HIGH |
| GO-02 | _ = err (ignored error) | HIGH |
| GO-03 | Bare go func() | HIGH |
| GO-04 | sync/atomic instead of uber/atomic | HIGH |
| GO-05 | Direct base/glog import | HIGH |
| GO-06 | Direct MongoDB outside db_server | CRITICAL |
| GO-07 | Cross-service internal import | CRITICAL |
| GO-08 | common/ importing servers/ | CRITICAL |
| GO-09 | time.Now() instead of mtime | HIGH |
