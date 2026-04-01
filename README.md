# Danya — 游戏开发 AI 编程助手

<p align="center">
  <b>专为游戏开发打造的 AI 终端编程助手</b><br>
  理解游戏引擎 · 门禁链质量管控 · 全自动开发流水线 · 多模型支持
</p>

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

## 快速使用

```bash
# 初始化游戏项目（自动检测引擎，生成配置和 Hook）
cd <你的游戏项目>
danya init

# 启动交互模式
danya

# 常用命令
/review                              # 评分制代码审查（100 分制）
/auto-work "添加背包排序功能"          # 全自动流水线
/auto-bugfix "角色状态切换动画异常"     # Bug 自动修复
/parallel-execute prepare "大功能"     # 波次并行执行
```

快捷键：
- `Ctrl+G` — 打开外部编辑器（优先 `$EDITOR`，回退 code/nano/vim），关闭后内容自动回填
- `Shift+Enter` — 输入框内换行但不发送，普通 `Enter` 提交
- `Ctrl+M` — 快速切换模型
- `Shift+Tab` — 切换输入模式（普通 / Bash / 记忆）

---

## 功能特性

- **AI 驱动的助手** — 使用先进的 AI 模型理解并响应你的请求
- **多模型协同** — 灵活切换和组合使用多个 AI 模型（20+ 提供商），发挥各自优势
- **代码编辑** — 直接编辑文件，提供智能建议和改进
- **代码库理解** — 分析项目结构和代码关系
- **命令执行** — 实时运行 shell 命令并查看结果
- **工作流自动化** — 用简单的提示处理复杂的开发任务
- **交互式界面** — 美观的终端界面，支持语法高亮
- **工具系统** — 可扩展的架构，为不同任务提供专门的工具（22 通用 + 13 游戏专用）
- **上下文管理** — 智能的上下文处理，保持对话连续性
- **游戏引擎感知** — 自动识别 Unity / UE / Godot / Go 服务器，注入引擎领域知识
- **门禁链质量管控** — 6 道门禁强制执行代码质量标准
- **评分制审查** — 100 分制量化审查，33 条引擎检查规则
- **知识自动沉淀** — 开发成果自动文档化，不丢失项目知识

---

## Danya 是什么

Danya 是一个运行在终端中的 AI 编程助手，**专门为游戏开发场景设计**。它不是一个通用的代码补全工具，而是一个理解游戏项目架构、强制执行质量标准、并能自动化整个开发工作流的 Agent。

你可以把它理解为：**Claude Code 的游戏开发定制版**，融合了传统 Agent 的成熟工具系统、Kode 的多模型能力、以及 Game Harness Engineering 的质量治理体系。

```
                    ┌──────────────────────────┐
                    │         Danya            │
                    │                          │
                    │  传统 Agent 的工具系统    │
                    │  + Kode 的多模型能力      │
                    │  + Game Harness 的质量治理 │
                    │  + 游戏开发领域知识        │
                    └──────────────────────────┘
```

---

## 与 Claude Code / Codex / Kode 的区别

### 一句话总结

| 产品 | 定位 | 一句话描述 |
|------|------|----------|
| **Claude Code** | 通用编程助手 | Anthropic 官方 CLI，能力强但不懂游戏 |
| **Codex (OpenAI)** | 通用编程助手 | OpenAI 的终端 Agent，只支持 OpenAI 模型 |
| **Kode** | 通用编程助手 | Claude Code 开源替代，支持多模型 |
| **Danya** | **游戏开发编程助手** | 为游戏项目定制：理解引擎、门禁链、评分审查 |

### 详细对比

| 能力 | Claude Code | Codex | Kode | **Danya** |
|------|------------|-------|------|-----------|
| **游戏引擎理解** | 无 | 无 | 无 | **Unity / UE / Godot 自动识别，注入引擎知识** |
| **禁区防护** | 无 | 无 | 无 | **自动检测 auto-generated 代码，Hook 硬拦截** |
| **评分制审查** | 无 | 无 | 无 | **100 分制，33 条引擎检查，质量棘轮** |
| **门禁链** | 无 | 无 | 无 | **6 道门禁：Guard→Syntax→Verify→Commit→Review→Push** |
| **全自动流水线** | 无 | 无 | 无 | **/auto-work, /auto-bugfix, /parallel-execute** |
| **知识沉淀** | 无 | 无 | 无 | **自动写 Docs/（功能/Bug/调研）** |
| **Harness 自演进** | 无 | 无 | 无 | **Agent 出错后自动更新规则** |
| 多模型支持 | 仅 Anthropic | 仅 OpenAI | **20+ 提供商** | **20+ 提供商（继承 Kode）** |
| Hook 系统 | 18 种事件 | 无 | 4 种事件 | **18 种事件** |
| 权限系统 | 规则层叠 | 简单 | 简单 | **规则层叠** |
| 工具系统 | 43 个工具 | ~10 | 22 个 | **22 通用 + 13 游戏专用 = 35 个工具** |

### 核心差异：通用 vs 游戏专用

Claude Code / Codex / Kode 是**通用编程助手**——它们不知道：
- Unity 中应该用 `UniTask` 而不是 `Task`
- 配置和协议目录下的代码是自动生成的，不能手动编辑
- Go 游戏服务端应该用架构约定特点
- 游戏项目的多层架构不能反向引用
- 修改 `.proto` 文件后必须同步客户端和服务端

Danya **理解这些**，并且通过机械化的 Hook 和评分制审查来**强制执行**。

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

### 2. 自动生成代码禁区防护

游戏项目中有大量自动生成的代码（配置表、ORM、Protobuf 桩代码）。通用助手不知道这些不能碰，经常修改后被下一次生成覆盖。

Danya 的 **Gate 0 (Guard)** 在文件编辑前就拦截：

```
Agent 尝试编辑 Config/Gen/XXXConfig.cs
  → Guard Hook 检测到禁区
  → ❌ 阻断编辑
  → 告知 Agent："这是自动生成代码，改 Excel 源文件后重新生成"
```

### 3. 评分制代码审查（不再是 PASS/FAIL）

通用助手的代码审查只能给出主观的"看起来不错"。Danya 用**量化的评分系统**：

```
初始分：100
CRITICAL: -30（任何 CRITICAL = 直接 FAIL）
HIGH:     -10
MEDIUM:    -3
通过线：≥80 且无 CRITICAL

质量棘轮：分数只升不降，防止"修一个 bug 引入两个新 bug"
```

33 条机械检查自动运行（5 套引擎规则），AI 判断补充架构和逻辑审查。

### 4. 全自动开发流水线

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

═══ AUTO-WORK COMPLETE ═══
```

Bug 修复有专用流水线，**必须先复现才能修**：

```bash
/auto-bugfix "角色状态切换时动画异常"

→ 复现 → 定位根因 → 修复(最多5轮) → 审查 → 提交 → 经验固化
```

### 5. 多模型支持（国内团队友好）

不锁定任何一家 AI 提供商。4 种语义指针让不同任务用不同模型：

```yaml
pointers:
  main: "DeepSeek V3"     # 主对话用最强模型
  task: "Qwen Max"        # 子任务用便宜模型
  compact: "GLM-4"        # 压缩用快速模型
  quick: "GLM-4"          # 分类用快速模型
```

内置 3 个预设：`china.yaml`（DeepSeek+千问+智谱）、`international.yaml`（Claude+GPT）、`single-model.yaml`（单模型极简配置）。

### 6. 知识不丢失

游戏项目的知识容易随人员流动丢失。Danya 在每次任务完成后**自动沉淀**：

```
功能开发 → Docs/Version/<版本>/<功能>/summary.md
Bug 修复 → Docs/Bugs/<版本>/<bug名>.md
技术调研 → Docs/Engine/Research/<课题>/findings.md
```

下一个开发者接手时，这些文档已经在那里了。

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

**Push 令牌制**：审查通过才生成 `push-approved` 令牌，push 时检查并消费（一次性使用）。

---

## 技术架构

融合三个项目的最优设计：

| 来源 | 贡献 |
|------|------|
| **XXXXXX XXXX** | 工具系统(43工具)、Hook 系统(18事件)、权限层叠、对话压缩、Prompt 缓存 |
| **Kode** | 多模型系统(20+提供商)、Provider 适配器、模型配置 YAML、React/Ink 终端 UI |
| **Game Harness Engineering （Danya 原创）** | 门禁链、评分审查、全自动流水线、知识沉淀、Harness 自演进 |
| **Danya 原创** | 游戏引擎检测、引擎变体提示词、13 个游戏工具、AGENTS.md 模板 |

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
.danya/settings.json       — 项目 Hook 和权限配置
.danya/gate-chain.json     — 门禁链配置
.danya/guard-rules.json    — 禁区规则
AGENTS.md                  — 项目指令（AI 读取的规则和上下文）
```

---

## 文档

- [快速开始](docs/getting-started.md)
- [配置指南](docs/configuration.md)
- 引擎指南：[Unity](docs/engine-guides/unity.md) | [Unreal](docs/engine-guides/unreal.md) | [Godot](docs/engine-guides/godot.md) | [Go 服务端](docs/engine-guides/go-server.md)

---

## 学习项目声明

Danya 是一个**学习项目**，用于研究 AI Agent 在游戏开发中的工程化实践。它融合了 Claude Code、Kode、Game Harness Engineering 的设计，不用于商业用途。

核心价值不在于"又做了一个 Claude Code"，而在于回答一个问题：**AI Agent 专门为游戏开发定制后，能比通用助手好多少？**

答案是：
- 通用助手改完代码说"改完了"，你手动测 5-10 分钟 → Danya 自动验证 + 评分
- 通用助手不知道自动生成目录不能碰 → Danya Hook 硬拦截
- 通用助手的审查是 PASS/FAIL → Danya 是 100 分制量化评分
- 通用助手不沉淀知识 → Danya 自动写文档到 Docs/
- 将一套经过验证的 Harness 融合到 Agent 中，开箱即用

**领域专用 > 通用万能。**

## 许可证

Apache 2.0 许可证 - 详见 [LICENSE](LICENSE)。
