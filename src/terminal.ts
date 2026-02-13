import chalk from "chalk";
import Table from "cli-table3";
import type { SpeedReport } from "./analyzer.js";

const MODEL_COLORS: Record<string, (s: string) => string> = {
  opus: chalk.hex("#f78166"),
  sonnet: chalk.hex("#7ee787"),
  haiku: chalk.hex("#79c0ff"),
};

function colorForModel(model: string): (s: string) => string {
  for (const [key, colorFn] of Object.entries(MODEL_COLORS)) {
    if (model.toLowerCase().includes(key)) return colorFn;
  }
  return chalk.white;
}

function sparkline(values: number[]): string {
  if (values.length === 0) return "";
  const bars = "▁▂▃▄▅▆▇█";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v) => {
      const idx = Math.round(((v - min) / range) * (bars.length - 1));
      return bars[idx];
    })
    .join("");
}

export function renderTerminal(report: SpeedReport): void {
  if (report.totalSamples === 0) {
    console.log(chalk.yellow("\nNo data found. Make sure you have Claude Code conversation logs in ~/.claude/projects/\n"));
    return;
  }

  console.log(
    chalk.bold(`\n  Claude Code Output Speed (last ${report.days} days, ${report.totalSamples} samples)\n`)
  );

  // Model stats table
  const table = new Table({
    head: ["Model", "Samples", "Median", "Avg", "P10", "P90", "Min", "Max"].map((h) =>
      chalk.gray(h)
    ),
    style: { head: [], border: ["gray"] },
    chars: {
      top: "─", "top-mid": "┬", "top-left": "┌", "top-right": "┐",
      bottom: "─", "bottom-mid": "┴", "bottom-left": "└", "bottom-right": "┘",
      left: "│", "left-mid": "├", mid: "─", "mid-mid": "┼",
      right: "│", "right-mid": "┤", middle: "│",
    },
  });

  for (const stat of report.modelStats) {
    const color = colorForModel(stat.model);
    table.push([
      color(stat.model),
      String(stat.count),
      chalk.bold(stat.median + " tok/s"),
      stat.avg + " tok/s",
      stat.p10 + "",
      stat.p90 + "",
      stat.min + "",
      stat.max + "",
    ]);
  }

  console.log(table.toString());

  // Daily trend sparklines
  if (report.dailyTrends.length > 0) {
    console.log(chalk.bold("\n  Daily Trend (median tok/s)\n"));

    const models = [...new Set(report.dailyTrends.map((t) => t.model))];
    const dates = [...new Set(report.dailyTrends.map((t) => t.date))].sort();

    for (const model of models) {
      const color = colorForModel(model);
      const dailyValues = dates.map((date) => {
        const found = report.dailyTrends.find((t) => t.date === date && t.model === model);
        return found ? found.median : 0;
      });
      const nonZero = dailyValues.filter((v) => v > 0);
      if (nonZero.length === 0) continue;

      const spark = sparkline(nonZero);
      const latest = nonZero[nonZero.length - 1];
      console.log(`  ${color(model.padEnd(16))} ${spark}  ${chalk.bold(latest + "")} tok/s`);
    }
  }

  console.log();
}
