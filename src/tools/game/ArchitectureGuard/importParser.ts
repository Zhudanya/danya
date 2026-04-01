export type ImportStatement = {
  file_path: string
  line: number
  imported_path: string
  imported_module?: string
}

// C#: using FL.Gameplay.Town;
const CSHARP_USING = /^using\s+([A-Za-z][\w.]*)\s*;/

// Go: "servers/logic_server/internal/handler"
const GO_IMPORT = /^\s*"([^"]+)"/

// C++: #include "Engine/Actor.h"
const CPP_INCLUDE = /^#include\s+["<]([^">]+)[">]/

// GDScript: preload("res://scenes/player.gd")
const GDSCRIPT_PRELOAD = /preload\(["']([^"']+)["']\)/g

export function extractImports(content: string, filePath: string): ImportStatement[] {
  const ext = filePath.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'cs':
      return extractCSharpImports(content, filePath)
    case 'go':
      return extractGoImports(content, filePath)
    case 'cpp': case 'h': case 'hpp': case 'cc':
      return extractCppImports(content, filePath)
    case 'gd':
      return extractGDScriptImports(content, filePath)
    default:
      return []
  }
}

function extractCSharpImports(content: string, filePath: string): ImportStatement[] {
  const imports: ImportStatement[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(CSHARP_USING)
    if (match) {
      imports.push({
        file_path: filePath,
        line: i + 1,
        imported_path: match[1]!,
        imported_module: match[1]!.split('.')[0],
      })
    }
  }
  return imports
}

function extractGoImports(content: string, filePath: string): ImportStatement[] {
  const imports: ImportStatement[] = []
  const lines = content.split('\n')
  let inImportBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (line === 'import (') { inImportBlock = true; continue }
    if (inImportBlock && line === ')') { inImportBlock = false; continue }

    if (inImportBlock || line.startsWith('import "')) {
      const match = line.match(GO_IMPORT)
      if (match) {
        imports.push({
          file_path: filePath,
          line: i + 1,
          imported_path: match[1]!,
          imported_module: match[1]!.split('/')[0],
        })
      }
    }
  }
  return imports
}

function extractCppImports(content: string, filePath: string): ImportStatement[] {
  const imports: ImportStatement[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(CPP_INCLUDE)
    if (match) {
      imports.push({
        file_path: filePath,
        line: i + 1,
        imported_path: match[1]!,
      })
    }
  }
  return imports
}

function extractGDScriptImports(content: string, filePath: string): ImportStatement[] {
  const imports: ImportStatement[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    let match: RegExpExecArray | null
    const regex = new RegExp(GDSCRIPT_PRELOAD.source, 'g')
    while ((match = regex.exec(lines[i]!)) !== null) {
      imports.push({
        file_path: filePath,
        line: i + 1,
        imported_path: match[1]!,
      })
    }
  }
  return imports
}
