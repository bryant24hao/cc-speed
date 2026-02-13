# cc-speed

**[EN]** Analyze Claude Code token output speed from local JSONL logs.
**[中文]** 分析 Claude Code 的 token 输出速度。

---

<details open>
<summary><b>English</b></summary>

## What it does

`cc-speed` reads your local Claude Code conversation logs (`~/.claude/projects/**/*.jsonl`) and calculates token output speed (tokens/sec) by measuring the time between user and assistant messages.

It provides:
- Per-model statistics (median, avg, p10, p90)
- Daily trend sparklines in terminal
- Interactive HTML charts (scatter plot + histogram) with dark theme

## Install

```bash
npm install -g cc-speed
```

Or run directly:

```bash
npx cc-speed
```

## Usage

```bash
# Default: terminal table for the last 7 days
cc-speed

# Custom time range
cc-speed --days 30

# Generate HTML chart and open in browser
cc-speed --chart

# JSON output (for piping)
cc-speed --json
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-d, --days <n>` | Number of days to analyze | `7` |
| `-c, --chart` | Generate HTML chart and open in browser | - |
| `-j, --json` | Output as JSON | - |

## Claude Code Slash Command

You can use `cc-speed` as a `/speed` command inside Claude Code:

```bash
# One-line install
bash <(curl -fsSL https://raw.githubusercontent.com/anthropics/cc-speed/main/install-skill.sh)
```

Or manually create `~/.claude/skills/cc-speed/SKILL.md`:

```markdown
---
name: speed
description: Analyze Claude Code token output speed
---

Run `npx cc-speed --chart` to analyze token output speed and generate charts.
```

Then type `/speed` in Claude Code to trigger it.

## How it works

1. Scans `~/.claude/projects/**/*.jsonl` for recent conversation logs
2. Pairs each `assistant` message with its preceding `user` message
3. Calculates `output_tokens / (assistant_timestamp - user_timestamp)`
4. Filters: `output_tokens > 10`, duration between 0.5s and 300s
5. Groups by model, computes statistics and trends

> **Note**: The speed is an estimate based on timestamp deltas. It includes network latency and any processing overhead, so actual generation speed may be higher.

## License

MIT

</details>

---

<details>
<summary><b>中文</b></summary>

## 功能介绍

`cc-speed` 读取本地 Claude Code 的对话日志（`~/.claude/projects/**/*.jsonl`），通过测量 user 和 assistant 消息之间的时间差来计算 token 输出速度（tokens/sec）。

提供：
- 按模型分组的速度统计（中位数、平均值、P10、P90）
- 终端中的每日趋势 sparkline 图
- 交互式 HTML 图表（散点图 + 直方图），暗色主题

## 安装

```bash
npm install -g cc-speed
```

或直接运行：

```bash
npx cc-speed
```

## 使用方法

```bash
# 默认：终端表格展示最近 7 天
cc-speed

# 自定义时间范围
cc-speed --days 30

# 生成 HTML 图表并在浏览器打开
cc-speed --chart

# JSON 输出（方便管道处理）
cc-speed --json
```

### 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-d, --days <n>` | 分析天数 | `7` |
| `-c, --chart` | 生成 HTML 图表并在浏览器打开 | - |
| `-j, --json` | 输出 JSON 格式 | - |

## Claude Code Slash Command

可以在 Claude Code 中通过 `/speed` 命令使用：

```bash
# 一行命令安装
bash <(curl -fsSL https://raw.githubusercontent.com/anthropics/cc-speed/main/install-skill.sh)
```

或手动创建 `~/.claude/skills/cc-speed/SKILL.md`：

```markdown
---
name: speed
description: 分析 Claude Code 的 token 输出速度
---

运行 `npx cc-speed --chart` 分析 token 输出速度并生成图表。
```

然后在 Claude Code 中输入 `/speed` 触发。

## 工作原理

1. 扫描 `~/.claude/projects/**/*.jsonl` 中的对话日志
2. 将每条 `assistant` 消息与其前一条 `user` 消息配对
3. 计算 `output_tokens / (assistant 时间戳 - user 时间戳)`
4. 过滤条件：`output_tokens > 10`，时长在 0.5s 到 300s 之间
5. 按模型分组，计算统计数据和趋势

> **注意**：速度是基于时间戳差值的估算，包含了网络延迟和处理开销，实际生成速度可能更高。

## 许可证

MIT

</details>
