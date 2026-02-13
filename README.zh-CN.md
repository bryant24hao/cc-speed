[English](./README.md) | [简体中文](#)

# cc-speed

分析 Claude Code 的 token 输出速度。

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
bash <(curl -fsSL https://raw.githubusercontent.com/bryant24hao/cc-speed/main/install-skill.sh)
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
