import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface SpeedDataPoint {
  timestamp: string;
  outputTokens: number;
  model: string;
  durationSec: number;
  tokensPerSec: number;
}

interface JsonlMessage {
  type?: string;
  timestamp?: string;
  model?: string;
  message?: {
    model?: string;
    usage?: { output_tokens?: number };
    content?: Array<{ type?: string }>;
  };
}

function isToolResult(msg: JsonlMessage): boolean {
  const content = msg.message?.content;
  return Array.isArray(content) && content[0]?.type === "tool_result";
}

function getAllJsonlFiles(dir: string, cutoffMs: number): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...getAllJsonlFiles(fullPath, cutoffMs));
      } else if (entry.name.endsWith(".jsonl")) {
        try {
          const stat = statSync(fullPath);
          if (stat.mtimeMs > cutoffMs) {
            results.push(fullPath);
          }
        } catch {
          // skip inaccessible files
        }
      }
    }
  } catch {
    // skip inaccessible directories
  }
  return results;
}

function parseJsonlFile(filePath: string): JsonlMessage[] {
  const messages: JsonlMessage[] = [];
  try {
    const lines = readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        messages.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // skip unreadable files
  }
  return messages;
}

function normalizeModel(msg: JsonlMessage): string {
  const raw = msg.message?.model || msg.model || "unknown";
  return raw
    .replace("claude-", "")
    .replace(/-\d{8}$/, "");
}

export function collectSpeedData(days: number): SpeedDataPoint[] {
  const projectsDir = join(homedir(), ".claude", "projects");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffMs = cutoff.getTime();

  const files = getAllJsonlFiles(projectsDir, cutoffMs);
  const dataPoints: SpeedDataPoint[] = [];

  for (const file of files) {
    const messages = parseJsonlFile(file);

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.type !== "assistant" || !msg.message?.usage?.output_tokens) continue;
      if (!msg.timestamp) continue;

      const ts = new Date(msg.timestamp);
      if (ts.getTime() < cutoffMs) continue;

      const outputTokens = msg.message.usage.output_tokens;
      const model = normalizeModel(msg);

      // Find preceding user message (human input or tool_result)
      let userTs: Date | null = null;
      for (let j = i - 1; j >= 0; j--) {
        if (messages[j].type === "user" && messages[j].timestamp) {
          userTs = new Date(messages[j].timestamp!);
          break;
        }
      }

      if (userTs && outputTokens > 10) {
        const durationSec = (ts.getTime() - userTs.getTime()) / 1000;
        const tokensPerSec = outputTokens / durationSec;
        // Filter: duration 0.5~300s AND speed <= 200 tok/s (no model exceeds this)
        if (durationSec > 0.5 && durationSec < 300 && tokensPerSec <= 200) {
          dataPoints.push({
            timestamp: ts.toISOString(),
            outputTokens,
            model,
            durationSec: Math.round(durationSec * 10) / 10,
            tokensPerSec: Math.round((outputTokens / durationSec) * 10) / 10,
          });
        }
      }
    }
  }

  dataPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return dataPoints;
}
