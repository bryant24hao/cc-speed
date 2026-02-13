import type { SpeedDataPoint } from "./collector.js";

export interface ModelStats {
  model: string;
  count: number;
  median: number;
  avg: number;
  p10: number;
  p90: number;
  min: number;
  max: number;
}

export interface DailyTrend {
  date: string;
  model: string;
  median: number;
  count: number;
}

export interface SpeedReport {
  modelStats: ModelStats[];
  dailyTrends: DailyTrend[];
  totalSamples: number;
  days: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.floor(sorted.length * p);
  return sorted[Math.min(idx, sorted.length - 1)];
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
  }
  return sorted[mid];
}

export function analyzeSpeed(data: SpeedDataPoint[], days: number = 7): SpeedReport {
  // Group by model
  const byModel = new Map<string, SpeedDataPoint[]>();
  for (const dp of data) {
    const arr = byModel.get(dp.model) || [];
    arr.push(dp);
    byModel.set(dp.model, arr);
  }

  // Compute per-model stats
  const modelStats: ModelStats[] = [];
  for (const [model, points] of byModel) {
    const speeds = points.map((p) => p.tokensPerSec).sort((a, b) => a - b);
    modelStats.push({
      model,
      count: speeds.length,
      median: median(speeds),
      avg: Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10,
      p10: percentile(speeds, 0.1),
      p90: percentile(speeds, 0.9),
      min: speeds[0],
      max: speeds[speeds.length - 1],
    });
  }

  // Sort by model name
  modelStats.sort((a, b) => a.model.localeCompare(b.model));

  // Compute daily trends
  const dailyMap = new Map<string, SpeedDataPoint[]>();
  for (const dp of data) {
    const date = dp.timestamp.slice(0, 10);
    const key = `${date}|${dp.model}`;
    const arr = dailyMap.get(key) || [];
    arr.push(dp);
    dailyMap.set(key, arr);
  }

  const dailyTrends: DailyTrend[] = [];
  for (const [key, points] of dailyMap) {
    const [date, model] = key.split("|");
    const speeds = points.map((p) => p.tokensPerSec).sort((a, b) => a - b);
    dailyTrends.push({
      date,
      model,
      median: median(speeds),
      count: speeds.length,
    });
  }

  dailyTrends.sort((a, b) => a.date.localeCompare(b.date) || a.model.localeCompare(b.model));

  return {
    modelStats,
    dailyTrends,
    totalSamples: data.length,
    days,
  };
}
