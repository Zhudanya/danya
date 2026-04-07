export const TOOL_NAME = 'AssetCheck'

export const DESCRIPTION = `Check game assets for integrity issues: missing references, broken prefabs, orphaned assets, naming violations, and size warnings. Supports Unity (.meta/GUID), Unreal (.uasset/soft references/naming conventions), and Godot (.tscn/ext_resource) asset pipelines.

Usage:
- Scans asset files for broken or missing references
- Scope: 'changed' checks only git-modified files, 'full' checks all assets
- Detects: missing_reference, broken_prefab, orphaned_asset, naming_violation, size_warning, deep_nesting, inactive_large_object
- Filterable by asset type: prefab, scene, material, audio, texture
- Unreal: checks naming conventions (SM_, T_, M_, BP_ prefixes) and source asset sizes
- Typical execution: 1-30s depending on scope`
