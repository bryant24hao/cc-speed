import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const skillDir = join(homedir(), ".claude", "skills", "cc-speed");
const skillFile = join(skillDir, "SKILL.md");

// Only install if ~/.claude exists (i.e. user has Claude Code)
const claudeDir = join(homedir(), ".claude");
if (!existsSync(claudeDir)) {
  process.exit(0);
}

const content = `---
name: speed
description: Analyze Claude Code token output speed / 分析 Claude Code 的 token 输出速度
---

Run \`npx cc-speed --chart\` to analyze token output speed and generate charts.
`;

try {
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(skillFile, content);
  console.log("✔ Installed /speed command for Claude Code");
} catch {
  // Silently fail — not critical
}
