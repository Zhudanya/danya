/**
 * Simple template engine for harness bundle files.
 * Replaces {{VARIABLE}} placeholders with detected project values.
 */

export type TemplateContext = {
  projectName: string
  engine: string | null
  serverLanguage: string | null
  configGenPath: string
  frameworkPath: string
  protoPath: string
  ormPath: string
  instructionsFile: string
}

export function renderTemplate(content: string, ctx: TemplateContext): string {
  return content
    .replace(/\{\{PROJECT_NAME\}\}/g, ctx.projectName)
    .replace(/\{\{ENGINE\}\}/g, ctx.engine ?? 'unknown')
    .replace(/\{\{SERVER_LANG\}\}/g, ctx.serverLanguage ?? 'none')
    .replace(/\{\{CONFIG_GEN_PATH\}\}/g, ctx.configGenPath)
    .replace(/\{\{FRAMEWORK_PATH\}\}/g, ctx.frameworkPath)
    .replace(/\{\{PROTO_PATH\}\}/g, ctx.protoPath)
    .replace(/\{\{ORM_PATH\}\}/g, ctx.ormPath)
    .replace(/\{\{INSTRUCTIONS_FILE\}\}/g, ctx.instructionsFile)
}

export function buildTemplateContext(
  projectName: string,
  engine: string | null,
  serverLanguage: string | null,
  instructionsFile: string,
): TemplateContext {
  let configGenPath = 'Config/Gen/'
  let frameworkPath = 'Scripts/Framework/'
  let protoPath = 'Proto/'
  let ormPath = 'orm/'

  if (engine === 'unity') {
    configGenPath = 'Assets/Scripts/Gameplay/Config/Gen/'
    frameworkPath = 'Assets/Scripts/Framework/'
    protoPath = 'Assets/Scripts/Proto/'
  } else if (engine === 'unreal') {
    configGenPath = 'Source/Generated/'
    frameworkPath = 'Source/Core/'
    protoPath = 'Source/Proto/'
  } else if (engine === 'godot') {
    configGenPath = 'scripts/generated/'
    frameworkPath = 'scripts/core/'
    protoPath = 'proto/'
  }

  // Only apply Go paths if no engine is set (server-only project)
  // In workspace mode, engine and server are in separate sub-projects
  if (serverLanguage === 'go' && !engine) {
    configGenPath = 'common/config/cfg_*.go'
    ormPath = 'orm/(golang|redis|mongo)/'
    protoPath = 'resources/proto/'
  }

  return { projectName, engine, serverLanguage, configGenPath, frameworkPath, protoPath, ormPath, instructionsFile }
}
