/**
 * Phase 0 Milestone Verification: "在 Unity 项目启动 danya，提示词含 Unity 变体"
 */
import { mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { detectProject } from '../src/engine/detect'
import { getEngineVariantPrompt, getEngineDisplayName } from '../src/engine/index'

// Simulate a Unity project
const UNITY_DIR = join(tmpdir(), 'danya-milestone', 'unity-project')
mkdirSync(join(UNITY_DIR, 'ProjectSettings'), { recursive: true })
mkdirSync(join(UNITY_DIR, 'Assets'), { recursive: true })

console.log('═══════════════════════════════════════════')
console.log('  里程碑验证: 在 Unity 项目启动 danya')
console.log('═══════════════════════════════════════════\n')

// Step 1: Engine detection
const detection = detectProject(UNITY_DIR)
console.log(`Engine detected: ${detection.engine}`)
console.log(`Languages: ${detection.languages.join(', ')}`)
console.log(`Server: ${detection.serverLanguage ?? 'none'}`)

// Step 2: Engine variant prompt
const variant = getEngineVariantPrompt(detection.engine)
console.log(`\nEngine variant loaded: ${getEngineDisplayName(detection.engine)}`)
console.log(`Variant length: ${variant.length} chars`)

// Step 3: Check key Unity content in variant
const checks = [
  { keyword: 'UniTask', found: variant.includes('UniTask') },
  { keyword: 'DOTS', found: variant.includes('DOTS') },
  { keyword: 'MonoBehaviour', found: variant.includes('MonoBehaviour') },
  { keyword: 'Destroy', found: variant.includes('Destroy') },
  { keyword: 'object pool', found: variant.toLowerCase().includes('object pool') || variant.includes('pooled') },
  { keyword: 'Debug.Log', found: variant.includes('Debug.Log') },
  { keyword: 'Subscribe/Unsubscribe', found: variant.includes('Unsubscribe') },
]

console.log('\nUnity variant content checks:')
let allPassed = true
for (const check of checks) {
  const status = check.found ? '✅' : '❌'
  console.log(`  ${status} Contains "${check.keyword}"`)
  if (!check.found) allPassed = false
}

// Step 4: Simulate what the environment section would look like
console.log(`\n--- Simulated Environment Section ---`)
console.log(`Working directory: ${UNITY_DIR}`)
console.log(`Game engine: ${getEngineDisplayName(detection.engine)}`)
console.log(`Languages: ${detection.languages.join(', ')}`)
console.log(`Server language: ${detection.serverLanguage ?? 'None detected'}`)

// Step 5: Verify system prompt identity
import { PRODUCT_NAME, PRODUCT_COMMAND } from '../src/constants/product'
console.log(`\n--- Product Identity ---`)
console.log(`Name: ${PRODUCT_NAME}`)
console.log(`Command: ${PRODUCT_COMMAND}`)

console.log('\n═══════════════════════════════════════════')
if (allPassed && detection.engine === 'unity' && PRODUCT_NAME === 'Danya') {
  console.log('  ✅ 里程碑验证通过: Unity 项目检测 + 提示词含 Unity 变体')
} else {
  console.log('  ❌ 里程碑验证失败')
  process.exit(1)
}
console.log('═══════════════════════════════════════════')
