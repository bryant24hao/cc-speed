import { describe, it, expect } from "vitest";
import { analyzeSpeed } from "../analyzer.js";
import type { SpeedDataPoint } from "../collector.js";

function makePoint(overrides: Partial<SpeedDataPoint> = {}): SpeedDataPoint {
  return {
    timestamp: "2026-02-14T10:00:00.000Z",
    outputTokens: 100,
    model: "sonnet-4-5",
    durationSec: 5,
    tokensPerSec: 20,
    ...overrides,
  };
}

describe("analyzeSpeed", () => {
  it("returns empty stats for empty data", () => {
    const report = analyzeSpeed([], 7);
    expect(report.modelStats).toEqual([]);
    expect(report.dailyTrends).toEqual([]);
    expect(report.totalSamples).toBe(0);
  });

  it("computes correct stats for single model", () => {
    const data: SpeedDataPoint[] = [
      makePoint({ tokensPerSec: 10 }),
      makePoint({ tokensPerSec: 20 }),
      makePoint({ tokensPerSec: 30 }),
      makePoint({ tokensPerSec: 40 }),
      makePoint({ tokensPerSec: 50 }),
    ];

    const report = analyzeSpeed(data, 7);
    expect(report.modelStats.length).toBe(1);

    const stat = report.modelStats[0];
    expect(stat.model).toBe("sonnet-4-5");
    expect(stat.count).toBe(5);
    expect(stat.median).toBe(30);
    expect(stat.avg).toBe(30);
    expect(stat.min).toBe(10);
    expect(stat.max).toBe(50);
    expect(stat.p10).toBe(10);
    expect(stat.p90).toBe(50);
  });

  it("groups stats by model", () => {
    const data: SpeedDataPoint[] = [
      makePoint({ model: "opus-4-6", tokensPerSec: 15 }),
      makePoint({ model: "opus-4-6", tokensPerSec: 25 }),
      makePoint({ model: "sonnet-4-5", tokensPerSec: 40 }),
      makePoint({ model: "sonnet-4-5", tokensPerSec: 60 }),
    ];

    const report = analyzeSpeed(data, 7);
    expect(report.modelStats.length).toBe(2);
    expect(report.modelStats.map((s) => s.model)).toContain("opus-4-6");
    expect(report.modelStats.map((s) => s.model)).toContain("sonnet-4-5");
  });

  it("computes daily trends", () => {
    const data: SpeedDataPoint[] = [
      makePoint({ timestamp: "2026-02-13T10:00:00.000Z", tokensPerSec: 20 }),
      makePoint({ timestamp: "2026-02-13T12:00:00.000Z", tokensPerSec: 30 }),
      makePoint({ timestamp: "2026-02-14T10:00:00.000Z", tokensPerSec: 40 }),
    ];

    const report = analyzeSpeed(data, 7);
    expect(report.dailyTrends.length).toBe(2);
    expect(report.dailyTrends[0].date).toBe("2026-02-13");
    expect(report.dailyTrends[0].median).toBe(25);
    expect(report.dailyTrends[1].date).toBe("2026-02-14");
    expect(report.dailyTrends[1].median).toBe(40);
  });

  it("reports total sample count", () => {
    const data = [makePoint(), makePoint(), makePoint()];
    const report = analyzeSpeed(data, 7);
    expect(report.totalSamples).toBe(3);
    expect(report.days).toBe(7);
  });
});
