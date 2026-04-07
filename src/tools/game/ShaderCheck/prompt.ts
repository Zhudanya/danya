export const TOOL_NAME = 'ShaderCheck'

export const DESCRIPTION = `Validate shader files and detect common issues across Unity, Unreal, and Godot projects. Performs static analysis for variant explosion, syntax errors, sampler count limits, and instruction complexity.

Usage:
- Scans shader files for issues based on detected engine
- Unity: .shader, .hlsl, .cginc files
- Unreal: .usf, .ush files
- Godot: .gdshader files
- Scope: 'changed' checks only git-modified files, 'full' checks all shaders
- Detects: variant_explosion, syntax_error, sampler_limit, complexity_warning
- Typical execution: 1-15s depending on scope`
