export const TOOL_NAME = 'ProtoCompat'

export const DESCRIPTION = `Detect breaking changes in Protocol Buffer (.proto) files by analyzing git diff.

Checks for:
- Field number changes (CRITICAL)
- Field type changes (CRITICAL)
- Deleted fields not marked as reserved (HIGH)
- Enum value renumbering (CRITICAL)
- Required field additions (HIGH)
- Removed service/RPC methods (HIGH)

Returns structured issues with severity, file path, and description.`
