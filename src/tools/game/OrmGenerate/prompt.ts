export const TOOL_NAME = 'OrmGenerate'

export const DESCRIPTION = `Generate ORM code from schema definitions. Invokes the project's code generation pipeline (typically make orm) to produce typed data access code.

Usage:
- Reads schema files and generates code for specified targets
- Supported targets: golang, redis, mongo, proto
- Generates files in the project directory structure
- Reports which files were generated and any schema errors
- Typical execution: 5-30s`
