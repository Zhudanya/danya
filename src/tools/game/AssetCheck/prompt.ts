export const TOOL_NAME = 'AssetCheck'

export const DESCRIPTION = `Check game assets for integrity issues: missing references, broken prefabs, and orphaned assets. Supports Unity (.meta/GUID) and Godot (.tscn/ext_resource) asset pipelines.

Usage:
- Scans asset files for broken or missing references
- Scope: 'changed' checks only git-modified files, 'full' checks all assets
- Detects: missing_reference, broken_prefab, orphaned_asset
- Filterable by asset type: prefab, scene, material, audio, texture
- Typical execution: 1-30s depending on scope`
