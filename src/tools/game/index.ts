/**
 * Game-specific tool registry.
 * Conditionally loads tools based on detected engine and server language.
 */

import type { Tool } from '@tool'
import { detectProject } from '../../engine/detect'
import { getCwd } from '@utils/state'

// Lazy imports to avoid loading tools for engines not in use
let _cachedTools: Tool[] | null = null

export function getGameTools(): Tool[] {
  if (_cachedTools) return _cachedTools

  const detection = detectProject(getCwd())
  const tools: Tool[] = []

  // Always available (cross-engine)
  try {
    const { ScoreReviewTool } = require('./ScoreReview/ScoreReview')
    tools.push(ScoreReviewTool as unknown as Tool)
  } catch {}

  try {
    const { ArchitectureGuardTool } = require('./ArchitectureGuard/ArchitectureGuard')
    tools.push(ArchitectureGuardTool as unknown as Tool)
  } catch {}

  try {
    const { KnowledgeSedimentTool } = require('./KnowledgeSediment/KnowledgeSediment')
    tools.push(KnowledgeSedimentTool as unknown as Tool)
  } catch {}

  try {
    const { GateChainTool } = require('./GateChain/GateChain')
    tools.push(GateChainTool as unknown as Tool)
  } catch {}

  try {
    const { ProtoCompileTool } = require('./ProtoCompile/ProtoCompile')
    tools.push(ProtoCompileTool as unknown as Tool)
  } catch {}

  try {
    const { ProtoCompatTool } = require('./ProtoCompat/ProtoCompat')
    tools.push(ProtoCompatTool as unknown as Tool)
  } catch {}

  try {
    const { ConfigGenerateTool } = require('./ConfigGenerate/ConfigGenerate')
    tools.push(ConfigGenerateTool as unknown as Tool)
  } catch {}

  // Unity / C# projects
  if (detection.engine === 'unity' || detection.engine === 'godot') {
    try {
      const { CSharpSyntaxCheckTool } = require('./CSharpSyntaxCheck/CSharpSyntaxCheck')
      tools.push(CSharpSyntaxCheckTool as unknown as Tool)
    } catch {}
  }

  // Unity build
  if (detection.engine === 'unity') {
    try {
      const { UnityBuildTool } = require('./UnityBuild/UnityBuild')
      tools.push(UnityBuildTool as unknown as Tool)
    } catch {}
  }

  // Unreal build
  if (detection.engine === 'unreal') {
    try {
      const { UnrealBuildTool } = require('./UnrealBuild/UnrealBuild')
      tools.push(UnrealBuildTool as unknown as Tool)
    } catch {}
  }

  // Godot build
  if (detection.engine === 'godot') {
    try {
      const { GodotBuildTool } = require('./GodotBuild/GodotBuild')
      tools.push(GodotBuildTool as unknown as Tool)
    } catch {}
  }

  // ORM generation (Go server projects)
  if (detection.serverLanguage === 'go') {
    try {
      const { OrmGenerateTool } = require('./OrmGenerate/OrmGenerate')
      tools.push(OrmGenerateTool as unknown as Tool)
    } catch {}
  }

  // Performance lint (any game engine)
  if (detection.engine) {
    try {
      const { PerfLintTool } = require('./PerfLint/PerfLint')
      tools.push(PerfLintTool as unknown as Tool)
    } catch {}
  }

  // Asset check (any game engine)
  if (detection.engine) {
    try {
      const { AssetCheckTool } = require('./AssetCheck/AssetCheck')
      tools.push(AssetCheckTool as unknown as Tool)
    } catch {}
  }

  // Shader check (any game engine)
  if (detection.engine) {
    try {
      const { ShaderCheckTool } = require('./ShaderCheck/ShaderCheck')
      tools.push(ShaderCheckTool as unknown as Tool)
    } catch {}
  }

  // Go server
  if (detection.serverLanguage === 'go') {
    try {
      const { GameServerBuildTool } = require('./GameServerBuild/GameServerBuild')
      tools.push(GameServerBuildTool as unknown as Tool)
    } catch {}
  }

  // C++ server
  if (detection.serverLanguage === 'cpp') {
    try {
      const { CppServerBuildTool } = require('./CppServerBuild/CppServerBuild')
      tools.push(CppServerBuildTool as unknown as Tool)
    } catch {}
  }

  // Java server
  if (detection.serverLanguage === 'java') {
    try {
      const { JavaServerBuildTool } = require('./JavaServerBuild/JavaServerBuild')
      tools.push(JavaServerBuildTool as unknown as Tool)
    } catch {}
  }

  // Node.js server
  if (detection.serverLanguage === 'nodejs') {
    try {
      const { NodeServerBuildTool } = require('./NodeServerBuild/NodeServerBuild')
      tools.push(NodeServerBuildTool as unknown as Tool)
    } catch {}
  }

  _cachedTools = tools
  return tools
}

export function resetGameToolsCache(): void {
  _cachedTools = null
}
