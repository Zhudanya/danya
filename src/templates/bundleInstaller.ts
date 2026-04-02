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
    const targetPath = join(targetDir, relativePath)
    const dir = dirname(targetPath)

    if (!existsSync(targetPath) || options.force) {
      mkdirSync(dir, { recursive: true })
      const rendered = relativePath.endsWith('.tmpl')
        ? renderTemplate(content, ctx)
        : content
      const finalPath = relativePath.endsWith('.tmpl')
        ? targetPath.replace(/\.tmpl$/, '')
        : targetPath
      writeFileSync(finalPath, rendered, { encoding: 'utf-8', mode: relativePath.includes('hooks/') ? 0o755 : 0o644 })
      installed.push(relative(targetDir, finalPath))
    }
  }

  return installed
}
