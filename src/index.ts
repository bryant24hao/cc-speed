import { program } from "commander";
import ora from "ora";
import { collectSpeedData } from "./collector.js";
import { analyzeSpeed } from "./analyzer.js";
import { renderTerminal } from "./terminal.js";
import { generateChart } from "./chart.js";
import { exec } from "child_process";
import { platform } from "os";

program
  .name("cc-speed")
  .description("Analyze Claude Code token output speed")
  .version("0.1.0")
  .option("-d, --days <number>", "Number of days to analyze", "7")
  .option("-c, --chart", "Generate HTML chart and open in browser")
  .option("-j, --json", "Output as JSON")
  .action(async (opts) => {
    const days = parseInt(opts.days, 10);

    const spinner = ora("Scanning Claude Code logs...").start();
    const data = collectSpeedData(days);
    spinner.succeed(`Found ${data.length} data points from ${days} days`);

    if (data.length === 0) {
      console.log("\nNo data found. Make sure you have Claude Code conversation logs in ~/.claude/projects/\n");
      return;
    }

    const report = analyzeSpeed(data, days);

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    if (opts.chart) {
      const chartSpinner = ora("Generating chart...").start();
      const chartPath = generateChart(data, report);
      chartSpinner.succeed(`Chart saved to ${chartPath}`);

      const openCmd = platform() === "darwin" ? "open" : platform() === "win32" ? "start" : "xdg-open";
      exec(`${openCmd} "${chartPath}"`);
      return;
    }

    // Default: terminal output
    renderTerminal(report);
  });

program.parse();
