import * as fs from "fs";
import * as path from "path";
import { AEOReport } from "./tracker";

export function generateAEOReport(report: AEOReport): string {
  const date = new Date().toISOString().split("T")[0];
  const lines: string[] = [];

  lines.push(`# AEO Audit Report`);
  lines.push(`**Brand:** ${report.brand}`);
  lines.push(`**Domain:** ${report.domain}`);
  lines.push(`**Date:** ${date}`);
  lines.push(`**Queries Run:** ${report.queries.length}`);
  lines.push("");

  // overall visibility score
  const visibilityPercent = Math.round(report.mentionRate * 100);
  lines.push(`## AI Search Visibility`);
  lines.push(`**Mention Rate:** ${visibilityPercent}% of queries returned a brand mention`);
  lines.push(`**Total Mentions:** ${report.totalMentions}`);
  lines.push("");

  if (visibilityPercent === 0) {
    lines.push(`> ⚠️ ${report.brand} has zero visibility in AI search responses.`);
    lines.push(`> Potential customers asking AI assistants about this product category are not being directed to ${report.brand}.`);
  } else if (visibilityPercent < 50) {
    lines.push(`> ⚠️ ${report.brand} has low visibility in AI search responses.`);
  } else {
    lines.push(`> ✅ ${report.brand} has strong AI search visibility.`);
  }
  lines.push("");

  // competitor share of voice
  lines.push(`## Competitor Share of Voice`);
  if (report.topCompetitors.length === 0) {
    lines.push(`No known competitors detected in responses.`);
  } else {
    lines.push(`These competitors appeared in AI responses instead of or alongside ${report.brand}:\n`);
    for (const competitor of report.topCompetitors) {
      lines.push(`- **${competitor.name}** — mentioned in ${competitor.count} query responses`);
    }
  }
  lines.push("");

  // query by query breakdown
  lines.push(`## Query Breakdown`);
  for (const result of report.queries) {
    lines.push(`### "${result.query}"`);
    lines.push(`**Brand Mentioned:** ${result.brandMentioned ? "✅ Yes" : "❌ No"}`);
    lines.push(`**Mention Count:** ${result.mentionCount}`);
    lines.push(`**Competitors Detected:** ${result.competitors.length > 0 ? result.competitors.join(", ") : "none"}`);
    lines.push("");
    lines.push(`**AI Response:**`);
    lines.push(`> ${result.response.split("\n").join("\n> ")}`);
    lines.push("");
  }

  return lines.join("\n");
}

export function saveAEOReport(report: AEOReport): string {
  const content = generateAEOReport(report);
  const date = new Date().toISOString().split("T")[0];
  const filename = `aeo-audit-${date}.md`;
  const filepath = path.join("reports", filename);

  if (!fs.existsSync("reports")) {
    fs.mkdirSync("reports");
  }

  fs.writeFileSync(filepath, content);
  console.log(`\n📄 AEO report saved to ${filepath}`);
  return filepath;
}