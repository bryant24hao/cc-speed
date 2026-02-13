[English](#) | [简体中文](./README.zh-CN.md)

# cc-speed

Analyze Claude Code token output speed from local JSONL logs.

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
bash <(curl -fsSL https://raw.githubusercontent.com/bryant24hao/cc-speed/main/install-skill.sh)
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
