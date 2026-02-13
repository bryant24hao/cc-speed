import { writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import type { SpeedDataPoint } from "./collector.js";
import type { SpeedReport } from "./analyzer.js";

export function generateChart(data: SpeedDataPoint[], report: SpeedReport): string {
  // Build stat cards HTML
  let statCards = "";
  for (const stat of report.modelStats) {
    const cls = stat.model.includes("opus")
      ? "opus"
      : stat.model.includes("haiku")
        ? "haiku"
        : "sonnet";
    statCards += `<div class="stat-card">`;
    statCards += `<div class="stat-label">${stat.model}</div>`;
    statCards += `<div class="stat-value ${cls}">${stat.median} <span style="font-size:14px;color:#8b949e">tok/s</span></div>`;
    statCards += `<div class="stat-label">median &middot; avg ${stat.avg} &middot; p10 ${stat.p10} &middot; p90 ${stat.p90} &middot; n=${stat.count}</div>`;
    statCards += `</div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Claude Code Token Output Speed</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"><\/script>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0d1117; color: #e6edf3; padding: 24px; margin: 0; }
h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
.subtitle { color: #8b949e; font-size: 14px; margin-bottom: 24px; }
.chart-container { background: #161b22; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #30363d; }
.stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.stat-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px 20px; min-width: 140px; }
.stat-label { color: #8b949e; font-size: 12px; margin-bottom: 4px; }
.stat-value { font-size: 24px; font-weight: 700; }
.opus { color: #f78166; }
.sonnet { color: #7ee787; }
.haiku { color: #79c0ff; }
canvas { max-height: 400px; }
.lang-toggle { position: fixed; top: 16px; right: 24px; background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 4px; display: flex; gap: 2px; z-index: 100; }
.lang-toggle button { background: none; border: none; color: #8b949e; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; }
.lang-toggle button.active { background: #30363d; color: #e6edf3; }
</style></head><body>
<div class="lang-toggle">
  <button id="btn-en" class="active" onclick="setLang('en')">EN</button>
  <button id="btn-zh" onclick="setLang('zh')">中文</button>
</div>
<h1 id="title">Claude Code Output Speed (tokens/sec)</h1>
<div class="subtitle" id="subtitle">Last ${report.days} days &middot; ${report.totalSamples} samples &middot; based on user&rarr;assistant timestamp delta &middot; output_tokens &gt; 10</div>
<div class="stats">${statCards}</div>
<div class="chart-container"><canvas id="speedChart"></canvas></div>
<div class="chart-container"><canvas id="histChart"></canvas></div>
<script>
var i18n = {
  en: {
    title: "Claude Code Output Speed (tokens/sec)",
    subtitle: "Last ${report.days} days \\u00b7 ${report.totalSamples} samples \\u00b7 based on user\\u2192assistant timestamp delta \\u00b7 output_tokens > 10",
    scatterTitle: "Output Speed Over Time",
    histTitle: "Speed Distribution (tokens/sec)",
    ySpeed: "tokens/sec",
    yCount: "count"
  },
  zh: {
    title: "Claude Code \\u8f93\\u51fa\\u901f\\u5ea6 (tokens/sec)",
    subtitle: "\\u6700\\u8fd1 ${report.days} \\u5929 \\u00b7 ${report.totalSamples} \\u4e2a\\u6837\\u672c \\u00b7 \\u57fa\\u4e8e user\\u2192assistant \\u65f6\\u95f4\\u5dee\\u4f30\\u7b97 \\u00b7 \\u4ec5\\u7edf\\u8ba1 output_tokens > 10",
    scatterTitle: "\\u8f93\\u51fa\\u901f\\u5ea6\\u968f\\u65f6\\u95f4\\u53d8\\u5316",
    histTitle: "\\u901f\\u5ea6\\u5206\\u5e03 (tokens/sec)",
    ySpeed: "tokens/sec",
    yCount: "\\u6570\\u91cf"
  }
};
var currentLang = "en";

function setLang(lang) {
  currentLang = lang;
  document.getElementById("btn-en").className = lang === "en" ? "active" : "";
  document.getElementById("btn-zh").className = lang === "zh" ? "active" : "";
  document.getElementById("title").textContent = i18n[lang].title;
  document.getElementById("subtitle").textContent = i18n[lang].subtitle;
  if (window.scatterChart) {
    window.scatterChart.options.plugins.title.text = i18n[lang].scatterTitle;
    window.scatterChart.options.scales.y.title.text = i18n[lang].ySpeed;
    window.scatterChart.update();
  }
  if (window.histChart) {
    window.histChart.options.plugins.title.text = i18n[lang].histTitle;
    window.histChart.options.scales.y.title.text = i18n[lang].yCount;
    window.histChart.options.scales.x.title.text = i18n[lang].ySpeed;
    window.histChart.update();
  }
}

const data = ${JSON.stringify(data)};
const models = [...new Set(data.map(d => d.model))];
const colors = {
  'opus-4-6': '#f78166',
  'sonnet-4-5': '#7ee787',
  'haiku-4-5': '#79c0ff',
};
function getColor(model) {
  if (colors[model]) return colors[model];
  if (model.includes('opus')) return '#f78166';
  if (model.includes('haiku')) return '#79c0ff';
  return '#7ee787';
}

window.scatterChart = new Chart(document.getElementById("speedChart"), {
  type: "scatter",
  data: {
    datasets: models.map(model => ({
      label: model,
      data: data.filter(d => d.model === model).map(d => ({ x: new Date(d.timestamp), y: d.tokensPerSec })),
      backgroundColor: getColor(model) + "99",
      borderColor: getColor(model),
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: i18n[currentLang].scatterTitle, color: "#e6edf3" },
      legend: { labels: { color: "#e6edf3" } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pts = data.filter(dd => dd.model === ctx.dataset.label);
            const d = pts[ctx.dataIndex];
            if (!d) return "";
            return d.tokensPerSec + " tok/s \\u00b7 " + d.outputTokens + " tokens \\u00b7 " + d.durationSec + "s";
          }
        }
      }
    },
    scales: {
      x: { type: "time", time: { unit: "day" }, ticks: { color: "#8b949e" }, grid: { color: "#21262d" } },
      y: { title: { display: true, text: i18n[currentLang].ySpeed, color: "#8b949e" }, ticks: { color: "#8b949e" }, grid: { color: "#21262d" } }
    }
  }
});

var bucketSize = 5;
var maxSpeed = Math.ceil(Math.max(...data.map(d => d.tokensPerSec)) / bucketSize) * bucketSize;
var buckets = Array.from({ length: maxSpeed / bucketSize + 1 }, (_, i) => i * bucketSize);
var histDataMap = {};
models.forEach(function(model) {
  histDataMap[model] = new Array(buckets.length).fill(0);
  data.filter(dd => dd.model === model).forEach(function(d) {
    var idx = Math.floor(d.tokensPerSec / bucketSize);
    if (idx < histDataMap[model].length) histDataMap[model][idx]++;
  });
});

window.histChart = new Chart(document.getElementById("histChart"), {
  type: "bar",
  data: {
    labels: buckets.map(b => b + "-" + (b + bucketSize)),
    datasets: models.map(model => ({
      label: model,
      data: histDataMap[model],
      backgroundColor: getColor(model) + "99",
      borderColor: getColor(model),
      borderWidth: 1,
    })),
  },
  options: {
    responsive: true,
    plugins: {
      title: { display: true, text: i18n[currentLang].histTitle, color: "#e6edf3" },
      legend: { labels: { color: "#e6edf3" } }
    },
    scales: {
      x: { title: { display: true, text: i18n[currentLang].ySpeed, color: "#8b949e" }, ticks: { color: "#8b949e" }, grid: { color: "#21262d" } },
      y: { title: { display: true, text: i18n[currentLang].yCount, color: "#8b949e" }, ticks: { color: "#8b949e" }, grid: { color: "#21262d" } }
    }
  }
});
<\/script></body></html>`;

  const outPath = join(tmpdir(), "claude-speed.html");
  writeFileSync(outPath, html);
  return outPath;
}
