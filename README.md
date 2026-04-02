# Danya — 游戏开发 AI 编程助手

<p align="center">
  <b>专为游戏开发打造的 AI 终端编程助手</b><br>
  理解游戏引擎 · 门禁链质量管控 · 全自动开发流水线 · 多模型支持
</p>

[English](README_EN.md) | 中文

---

## 安装

```bash
# 方式一：npm 安装（推荐）
npm install -g @danya-ai/cli

# 方式二：从源码安装
git clone https://github.com/Zhudanya/danya.git
cd danya
bun install && bun run build
npm install -g .
```

```bash
# 验证安装
danya --version
```

## 更新

```bash
npm install -g @danya-ai/cli@latest
```

## 快速使用

```bash
# 进入你的游戏项目，启动 danya（首次启动会引导配置 AI 模型）
cd <你的游戏项目>
danya

# 初始化 harness（自动检测引擎，生成完整的规则、命令、Hook 体系）
# 注：首次启动时会自动初始化，也可以手动执行：
/init

# 对话内命令
/auto-work "添加背包排序功能"          # 全自动流水线（7 阶段）
/auto-bugfix "角色状态切换动画异常"     # Bug 自动修复（必须先复现）
/review                              # 评分制代码审查（100 分制）
/fix-harness                         # 自演进（更新 harness 规则）
/plan "大功能需求"                    # 分析需求，生成开发计划
/verify                              # 机械验证（quick | build | full）
/parallel-execute prepare "大功能"     # 波次并行执行
/orchestrate task.md                 # 自动迭代刷分（AI 写→验证→提交/回滚×N 轮）
/red-blue servers/                   # 红蓝对抗（红队找 bug→蓝队修→循环到零 bug）
/monitor summary 7                   # 查看 Harness 效果数据
```

```bash
# 终端命令（Shell 强制模式，适合大任务、无人值守）
danya auto-work "实现武器升级系统"     # Shell 强制流水线（每阶段独立 danya -p）
danya parallel <tasks-dir>           # 多 Agent 并行（独立 worktree）
danya red-blue [scope]               # 红蓝对抗（无人值守）
danya orchestrate <task.md>          # 自动迭代（AI 写→验证→提交/回滚）
danya analyze --metric summary       # 数据分析（8 种指标）
danya dashboard -w                   # 实时监控仪表盘
danya report                         # 月度报告
danya check-env                      # 环境依赖检查
```

### 配置 / 切换 AI 模型

在 danya 对话中输入 `/model`：

1. 选 **Manage Model List** → 添加新模型
2. 选择 Provider：
   - **Custom Messages API** — Claude 系列（Anthropic 官方接口）
   - **Custom OpenAI-Compatible API** — GPT / DeepSeek / 千问 / GLM 等
   - **Ollama** — 本地模型
3. 粘贴 API Key → 后续步骤一路回车（使用默认值即可）
4. 回到 `/model` 页面，选择要用的模型

常用模型配置参考：

| 模型 | Provider | Base URL | Model ID | Max Tokens | Context |
|------|----------|----------|----------|------------|---------|
| Claude Opus 4.6 | Messages API | `https://api.anthropic.com` | `claude-opus-4-6` | 16K | 200K |
| Claude Sonnet 4.6 | Messages API | `https://api.anthropic.com` | `claude-sonnet-4-6` | 16K | 200K |
| DeepSeek V3 | Messages API | `https://api.deepseek.com/anthropic` | `deepseek-chat` | 8K | 128K |
| GPT-4o | OpenAI-Compatible | `https://api.openai.com/v1` | `gpt-4o` | 16K | 128K |
| 千问 Max | OpenAI-Compatible | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` | 8K | 128K |

模型配置保存在 `~/.danya/config.json`，无需手动编辑。

快捷键：
- `Ctrl+G` — 打开外部编辑器（优先 `$EDITOR`，回退 code/nano/vim），关闭后内容自动回填
- `Shift+Enter` — 输入框内换行但不发送，普通 `Enter` 提交
- `Ctrl+M` — 快速切换模型
- `Shift+Tab` — 切换输入模式（普通 / Bash / 记忆）

---

## Danya 是什么

Danya 是一个运行在终端中的 AI 编程助手，**专门为游戏开发场景设计**。它不是一个通用的代码补全工具，而是一个理解游戏项目架构、强制执行质量标准、并能自动化整个开发工作流的 Agent。

**开箱即用**——进入游戏项目启动 Danya，它会自动检测引擎类型，生成完整的 harness 体系（规则、命令、Hook、记忆），不需要你手动搭建任何环境。如果你之前用过 Claude Code 或 Codex，已有的 `.claude/` 或 `.codex/` 配置会自动整合到 `.danya/` 中。

---

## 功能特性

### 基础能力
- **AI 驱动的助手** — 使用先进的 AI 模型理解并响应你的请求
- **多模型协同** — 灵活切换和组合使用多个 AI 模型（20+ 提供商），发挥各自优势
- **代码编辑** — 直接编辑文件，提供智能建议和改进
- **代码库理解** — 分析项目结构和代码关系
- **命令执行** — 实时运行 shell 命令并查看结果
- **交互式界面** — 美观的终端界面，支持语法高亮
- **工具系统** — 可扩展的架构（22 通用 + 13 游戏专用 = 35 个工具）

### 游戏开发专用
- **游戏引擎感知** — 自动识别 Unity / UE / Godot / Go 服务器，注入引擎领域知识
- **完整 Harness 内置** — `/init` 自动释放规则、命令、Hook、记忆模板，开箱即用
- **门禁链质量管控** — 6 道门禁强制执行代码质量标准（Hook 硬拦截，Agent 无法绕过）
- **评分制审查** — 100 分制量化审查，33 条引擎检查规则，质量棘轮
- **全自动流水线** — /auto-work（7 阶段）、/auto-bugfix（5 轮）、/parallel-execute（波次并行）
- **Harness 自演进** — Agent 出错修复后自动检测并更新规则，防止同类错误再次发生
- **知识自动沉淀** — 开发成果自动文档化到 Docs/，不丢失项目知识

### 自动化工具链
- **自动迭代刷分** — /orchestrate：AI 写代码→量化验证(0-100分)→通过提交/不过回滚×N 轮，5 次失败熔断
- **红蓝对抗测试** — /red-blue：红队找 bug→蓝队修→循环到零 bug→提炼经验到 rules
- **5 个角色 Agent** — code-writer、code-reviewer、red-team、blue-team、skill-extractor
- **Shell 强制编排** — 终端直接跑 `danya auto-work/parallel/red-blue/orchestrate`，每阶段独立进程，不可跳步
- **数据监控** — 自动采集工具调用、验证耗时、审查分数、bug 修复轮数到 JSONL
- **8 种数据分析** — `danya analyze`：工具分布、验证耗时、审查趋势、bug 修复效率、周对比
- **实时仪表盘** — `danya dashboard`：运行中的 Agent 进程、活跃会话、后台任务

### 工程化能力
- **三层隔离** — 自动检测 workspace（client + server），workspace 层 + 子项目层各有独立配置
- **Legacy 兼容** — 自动整合 `.claude/` 和 `.codex/` 已有配置到 `.danya/`，无缝迁移
- **智能上下文压缩** — 语义分组 + 选择性压缩 + 8 段结构化摘要 + 关键文件自动恢复
- **Subagent 调度** — 5+ 工具调用自动使用子 Agent，避免主上下文污染
- **自动初始化** — 首次启动时静默生成 `.danya/` 完整体系，无需手动 /init

---

## 对游戏开发的核心优势

### 1. 引擎感知的系统提示词

Danya 启动时自动检测项目引擎类型，注入对应的领域知识：

```
在 Unity 项目中启动 → 系统提示词包含：
  - MonoBehaviour 生命周期
  - UniTask 异步模式
  - DOTS/ECS 架构规则
  - 对象池使用规范
  - 事件订阅/退订配对

在 Go 服务端项目中启动 → 系统提示词包含：
  - 10+ 个微服务架构
  - RPC 调用链路
  - ORM 代码生成规则
  - 配置管线流程
```

这意味着 Agent 从**第一行输出**就知道项目的规则，不需要你反复提醒。

### 2. 完整 Harness 开箱即用

进入项目启动 Danya，自动生成完整的治理体系：

```
.danya/
├── rules/           — 约束规则（constitution、golden-principles、known-pitfalls...）
├── commands/        — 工作流命令（auto-work、review、fix-harness、verify...）
├── memory/          — 持久领域知识（架构层级、调用链、配置管线...）
├── hooks/           — 机械执行脚本（禁区守卫、提交检查、推送闸门、自演进检测...）
├── settings.json    — Hook 注册
├── gate-chain.json  — 门禁链配置
└── guard-rules.json — 禁区规则
```

4 套引擎模板内置（Unity、Go Server、Unreal、Godot），根据检测结果自动选择。用户可以自由增删改规则，Danya 不会覆盖用户的自定义内容。

### 3. 自动生成代码禁区防护

Danya 的 **Gate 0 (Guard)** 在文件编辑前就拦截：

```
Agent 尝试编辑 Config/Gen/XXXConfig.cs
  → Guard Hook 检测到禁区
  → 阻断编辑
  → 告知 Agent："这是自动生成代码，改 Excel 源文件后重新生成"
```

### 4. 评分制代码审查（不再是 PASS/FAIL）

```
初始分：100
CRITICAL: -30（任何 CRITICAL = 直接 FAIL）
HIGH:     -10
MEDIUM:    -3
通过线：>=80 且无 CRITICAL

质量棘轮：分数只升不降，防止"修一个 bug 引入两个新 bug"
```

33 条机械检查自动运行（5 套引擎规则），AI 判断补充架构和逻辑审查。

### 5. 全自动开发流水线

一条命令完成整个开发周期：

```bash
/auto-work "添加背包排序功能"

→ Stage 0: 分类 → feature
→ Stage 1: 规划 → 3 个文件需要修改
→ Stage 2: 编码 → 写代码 + 自动编译检查（fail-fast）
→ Stage 3: 审查 → 88/100 PASS
→ Stage 4: 提交 → <feat>(inventory) add item sorting
→ Stage 5: 沉淀 → Docs/Version/v1.2/inventory-sorting/summary.md
→ Stage 6: 自演进 → 更新规则文件
```

Bug 修复有专用流水线，**必须先复现才能修**：

```bash
/auto-bugfix "角色状态切换时动画异常"

→ 复现 → 定位根因 → 修复(最多5轮) → 审查 → 提交 → 经验固化
```

### 6. Harness 自演进

Agent 修复错误后，系统自动检测"出错→修复"模式，提示更新规则：

```
Agent 编译出错 → 修复 → 编译成功
  → 系统检测到 error-then-fix 模式
  → 提示 Agent 运行 /fix-harness
  → 自动路由到正确的规则文件（constitution / golden-principles / known-pitfalls...）
  → 添加：错误写法 + 正确写法
  → 下次不再犯同样的错
```

### 7. 三层隔离（Workspace 模式）

当项目包含客户端 + 服务器时，Danya 自动识别并创建分层配置：

```
workspace/
├── .danya/                — 跨项目规则（协议同步、配置表、版本管理）
├── client/
│   └── .danya/            — 客户端专属（Unity 规则、C# Hook、UI 架构）
└── server/
    └── .danya/            — 服务端专属（Go 规则、RPC 约束、ECS 架构）
```

单项目（仅客户端或仅服务器）则只用一层。

### 8. 多模型支持（国内团队友好）

不锁定任何一家 AI 提供商。4 种语义指针让不同任务用不同模型：

```yaml
pointers:
  main: "DeepSeek V3"     # 主对话用最强模型
  task: "Qwen Max"        # 子任务用便宜模型
  compact: "GLM-4"        # 压缩用快速模型
  quick: "GLM-4"          # 分类用快速模型
```

内置 3 个预设：`china.yaml`（DeepSeek+千问+智谱）、`international.yaml`（Claude+GPT）、`single-model.yaml`（单模型极简配置）。

### 9. 智能上下文压缩

长对话不会"失忆"——融合两种压缩策略的最优方案：

- **选择性压缩**：只压缩最老的消息，保留最近 4 条原文
- **语义分组**：工具调用请求和结果配对，不拆散完整交互
- **8 段结构化摘要**：技术上下文、项目概览、代码变更、调试问题、当前状态、待办任务、用户偏好、关键决策
- **关键文件自动恢复**：压缩后自动恢复最近访问的 5 个文件
- **模型智能切换**：优先用 compact 模型压缩，装不下时自动切 main 模型

### 10. 知识不丢失

游戏项目的知识容易随人员流动丢失。Danya 在每次任务完成后**自动沉淀**：

```
功能开发 → Docs/Version/<版本>/<功能>/summary.md
Bug 修复 → Docs/Bugs/<版本>/<bug名>.md
技术调研 → Docs/Engine/Research/<课题>/findings.md
```

下一个开发者接手时，这些文档已经在那里了。

### 11. 自动迭代与红蓝对抗

**自动迭代刷分**（orchestrator）：

```bash
danya orchestrate my-task.md -n 20
# AI 写代码 → 量化验证(0-100 分) → 通过提交/不过回滚 → 循环 20 轮
# 基线从 0 分一路刷到 85 分，5 次连续失败自动熔断
```

**红蓝对抗**：

```bash
danya red-blue servers/logic_server/
# 红队（只读）找所有 bug → 蓝队（可写）按优先级修 → 循环到零 bug
# 最后 skill-extractor 提炼经验写入 rules/memory
```

### 12. 数据监控与分析

所有工具调用、验证耗时、审查分数、bug 修复轮数自动采集到 `.danya/monitor/data/`。

```bash
danya analyze --metric summary --days 7    # 综合报告
danya analyze --metric compare --days 7    # 本周 vs 上周对比
danya dashboard -w                         # 实时监控仪表盘
```

8 种分析指标：工具分布、Top-N 工具、会话数、验证耗时、bug 修复效率、审查分数趋势、综合报告、周对比。

---

## 13 个游戏专用工具

| 工具 | 用途 | 适用引擎 |
|------|------|---------|
| **CSharpSyntaxCheck** | Roslyn 即时语法检查 | Unity, Godot |
| **UnityBuild** | Unity 编译管线 | Unity |
| **UnrealBuild** | UBT 编译 | UE |
| **GodotBuild** | GDScript/C# 检查 | Godot |
| **GameServerBuild** | 分级验证 (lint/build/test) | Go Server |
| **ProtoCompile** | Protobuf 编译 + 桩代码生成 | 跨引擎 |
| **ConfigGenerate** | 配置表生成 | 跨引擎 |
| **OrmGenerate** | ORM 代码生成 | Go Server |
| **ScoreReview** | 100 分制评分审查 | 跨引擎 |
| **GateChain** | 门禁链编排 | 跨引擎 |
| **KnowledgeSediment** | 知识自动沉淀 | 跨引擎 |
| **ArchitectureGuard** | 依赖方向检查 | 跨引擎 |
| **AssetCheck** | 资源引用完整性 | Unity, Godot |

---

## 门禁链

每次代码变更经过 6 道质量门禁：

```
Edit → Guard → Syntax → Verify → Commit → Review → Push
       Hook     Hook     Tool     Hook    AI+Tool   Hook
       (硬拦截) (即时检查)(编译测试)(lint+test)(评分制)(令牌制)
```

- **机械执行（Hook）**：Guard / Syntax / Commit / Push — shell 脚本，Agent 无法绕过
- **AI 判断（评分）**：Review — 需要理解代码质量，靠评分系统量化
- **自演进检测（Hook）**：PostToolUse 自动检测 error-then-fix 模式

**Push 令牌制**：审查通过才生成 `push-approved` 令牌，push 时检查并消费（一次性使用）。

---

## 与其他工具的兼容

| 场景 | 行为 |
|------|------|
| 项目已有 `.claude/` | 自动整合到 `.danya/`，不丢失自定义内容 |
| 项目已有 `.codex/` | 同上，自动整合 |
| `.danya/` 和 `.claude/` 同时存在 | `.danya/` 优先，`.claude/` 中独有的内容整合进来 |
| 同名文件冲突 | `.danya/` 的保留，`.claude/` 的跳过 |
| 运行时 | 只读 `.danya/`，不再读 `.claude/` 或 `.codex/` |
| Claude 模型 | `/init` 生成 `CLAUDE.md` |
| 其他模型 | `/init` 生成 `AGENTS.md` |

---

## 支持的引擎

| 引擎 | 检测方式 | 构建工具 | 审查规则数 |
|------|---------|---------|-----------|
| **Unity** | `ProjectSettings/` + `Assets/` | UnityBuild, CSharpSyntaxCheck | 9 条 (UC-01~09) |
| **Unreal Engine** | `*.uproject` | UnrealBuild | 6 条 (UE-01~06) |
| **Godot** | `project.godot` | GodotBuild | 5 条 (GD-01~05) |
| **Go 游戏服务器** | `go.mod` | GameServerBuild | 9 条 (GO-01~09) |

通用审查规则 4 条 (U-01~04)，所有项目自动应用。

---

## 配置

```
~/.danya/config.json       — 全局配置（API Key、模型配置）
.danya/
├── rules/                 — 约束规则（constitution, golden-principles, known-pitfalls...）
├── commands/              — 工作流命令（auto-work, review, fix-harness...）
├── memory/                — 持久领域知识
├── hooks/                 — 机械执行脚本（禁区防护、提交检查、推送闸门、自演进...）
├── agents/                — 角色 Agent（code-writer, red-team, blue-team...）
├── scripts/               — Shell 强制编排（auto-work-loop, parallel-wave, orchestrator...）
├── monitor/               — 数据采集与分析（log-*.py, analyze.py, dashboard.py）
├── templates/             — 任务定义模板（orchestrator 用）
├── settings.json          — Hook 注册
├── gate-chain.json        — 门禁链配置
└── guard-rules.json       — 禁区规则
CLAUDE.md / AGENTS.md      — 项目指令
```

---

## 学习项目声明

Danya 是一个**学习项目**，用于研究 AI Agent 在游戏开发中的工程化实践。不用于商业用途。

核心价值不在于"又做了一个 Claude Code"，而在于回答一个问题：**AI Agent 专门为游戏开发定制后，能比通用助手好多少？**

答案是：
- 通用助手改完代码说"改完了"，你手动测 5-10 分钟 → Danya 自动验证 + 评分
- 通用助手不知道自动生成目录不能碰 → Danya Hook 硬拦截
- 通用助手的审查是 PASS/FAIL → Danya 是 100 分制量化评分
- 通用助手不沉淀知识 → Danya 自动写文档到 Docs/
- 通用助手出错不会自我进化 → Danya 自动更新规则防止重犯
- 通用助手不懂 workspace 隔离 → Danya 自动识别 client/server 分层配置
- 将一套经过验证的 Game Harness 融合到 Agent 中，开箱即用

**领域专用 > 通用万能。**

## 许可证

Apache 2.0 许可证 - 详见 [LICENSE](LICENSE)。
