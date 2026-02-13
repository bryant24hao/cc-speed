#!/usr/bin/env bash
# Install cc-speed as a Claude Code /speed slash command

set -e

SKILL_DIR="$HOME/.claude/skills/cc-speed"
SKILL_FILE="$SKILL_DIR/SKILL.md"

mkdir -p "$SKILL_DIR"

cat > "$SKILL_FILE" << 'EOF'
---
name: speed
description: Analyze Claude Code token output speed / 分析 Claude Code 的 token 输出速度
---

Run `npx cc-speed --chart` to analyze token output speed and generate charts.
EOF

echo "Installed /speed command to $SKILL_FILE"
echo "You can now use /speed in Claude Code."
