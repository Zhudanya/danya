/**
 * Bundle Installer — releases harness template files into .danya/
 */

import { mkdirSync, writeFileSync, existsSync, readdirSync, statSync, readFileSync } from 'fs'
import { join, relative, extname, basename, dirname } from 'path'
import { renderTemplate, type TemplateContext } from './templateEngine'

export type InstalledFiles = string[]

export function installBundle(
  targetDir: string,
  bundleContent: Record<string, string>,
  ctx: TemplateContext,
  options: { force?: boolean } = {},
): InstalledFiles {
  const installed: InstalledFiles = []

  for (const [relativePath, content] of Object.entries(bundleContent)) {
    const isTemplate = relativePath.endsWith('.tmpl')
    const finalRelPath = isTemplate ? relativePath.replace(/\.tmpl$/, '') : relativePath
    const finalPath = join(targetDir, finalRelPath)
    const dir = dirname(finalPath)

    if (!existsSync(finalPath) || options.force) {
      mkdirSync(dir, { recursive: true })
      const rendered = isTemplate ? renderTemplate(content, ctx) : content
      writeFileSync(finalPath, rendered, { encoding: 'utf-8', mode: relativePath.includes('hooks/') ? 0o755 : 0o644 })
      installed.push(finalRelPath)
    }
  }

  return installed
}
