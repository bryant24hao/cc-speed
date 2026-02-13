import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";

// We need to mock homedir before importing collector
const testDir = join(tmpdir(), "cc-speed-test-" + Date.now());
const projectsDir = join(testDir, ".claude", "projects", "test-project");

vi.mock("os", async () => {
  const actual = await vi.importActual<typeof import("os")>("os");
  return { ...actual, homedir: () => testDir };
});

const { collectSpeedData } = await import("../collector.js");

beforeEach(() => {
  mkdirSync(projectsDir, { recursive: true });
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("collectSpeedData", () => {
  it("returns empty array when no files exist", () => {
    const result = collectSpeedData(7);
    expect(result).toEqual([]);
  });

  it("parses valid assistant messages with token data", () => {
    const now = new Date();
    const userTs = new Date(now.getTime() - 5000); // 5 seconds ago
    const assistantTs = now;

    const lines = [
      JSON.stringify({
        type: "user",
        timestamp: userTs.toISOString(),
      }),
      JSON.stringify({
        type: "assistant",
        timestamp: assistantTs.toISOString(),
        model: "claude-sonnet-4-5-20250929",
        message: {
          model: "claude-sonnet-4-5-20250929",
          usage: { output_tokens: 100 },
        },
      }),
    ];

    writeFileSync(join(projectsDir, "test.jsonl"), lines.join("\n"));

    const result = collectSpeedData(7);
    expect(result.length).toBe(1);
    expect(result[0].model).toBe("sonnet-4-5");
    expect(result[0].outputTokens).toBe(100);
    expect(result[0].durationSec).toBe(5);
    expect(result[0].tokensPerSec).toBe(20);
  });

  it("filters out messages with too few tokens", () => {
    const now = new Date();
    const userTs = new Date(now.getTime() - 5000);

    const lines = [
      JSON.stringify({ type: "user", timestamp: userTs.toISOString() }),
      JSON.stringify({
        type: "assistant",
        timestamp: now.toISOString(),
        message: { model: "claude-sonnet-4-5-20250929", usage: { output_tokens: 5 } },
      }),
    ];

    writeFileSync(join(projectsDir, "test.jsonl"), lines.join("\n"));

    const result = collectSpeedData(7);
    expect(result.length).toBe(0);
  });

  it("filters out messages with too short or too long duration", () => {
    const now = new Date();

    // Too short (0.1s)
    const lines1 = [
      JSON.stringify({ type: "user", timestamp: new Date(now.getTime() - 100).toISOString() }),
      JSON.stringify({
        type: "assistant",
        timestamp: now.toISOString(),
        message: { model: "claude-sonnet-4-5-20250929", usage: { output_tokens: 100 } },
      }),
    ];

    // Too long (400s)
    const lines2 = [
      JSON.stringify({ type: "user", timestamp: new Date(now.getTime() - 400000).toISOString() }),
      JSON.stringify({
        type: "assistant",
        timestamp: now.toISOString(),
        message: { model: "claude-sonnet-4-5-20250929", usage: { output_tokens: 100 } },
      }),
    ];

    writeFileSync(join(projectsDir, "short.jsonl"), lines1.join("\n"));
    writeFileSync(join(projectsDir, "long.jsonl"), lines2.join("\n"));

    const result = collectSpeedData(7);
    expect(result.length).toBe(0);
  });
});
