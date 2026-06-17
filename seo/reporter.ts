import * as fs from "fs";
import * as path from "path";
import { SEOReport } from "./crawler";

export function generateSEOReport(report: SEOReport): string {
  const date = new Date().toISOString().split("T")[0];
  const lines: string[] = [];

  lines.push(`# SEO Audit Report`);
  lines.push(`**Site:** ${report.baseUrl}`);
  lines.push(`**Date:** ${date}`);
  lines.push(`**Pages Crawled:** ${report.crawledPages.length}`);
  lines.push(`**Issues Found:** ${report.issues.length}`);
  lines.push("");

  // 404 status
  lines.push(`## 404 Page`);
  if (report.has404Page) {
    lines.push(`✅ Custom 404 page exists`);
  } else {
    lines.push(`❌ No custom 404 page — broken URLs silently redirect to homepage`);
  }
  lines.push("");

  // issues summary
  lines.push(`## Issues`);
  if (report.issues.length === 0) {
    lines.push(`✅ No issues found`);
  } else {
    for (const issue of report.issues) {
      lines.push(`- ❌ ${issue}`);
    }
  }
  lines.push("");

  // page by page breakdown
  lines.push(`## Page Breakdown`);
  for (const page of report.crawledPages) {
    lines.push(`### ${page.url}`);
    lines.push(`- **Status:** ${page.statusCode}`);
    lines.push(`- **Title:** ${page.title || "❌ Missing"}`);
    lines.push(`- **Meta Description:** ${page.metaDescription || "❌ Missing"}`);
    lines.push(`- **Canonical:** ${page.canonical || "❌ Missing"}`);
    if (page.canonicalIssue) {
      lines.push(`- ⚠️ Canonical mismatch — points to ${page.canonical} instead of itself`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function saveSEOReport(report: SEOReport): string {
  const content = generateSEOReport(report);
  const date = new Date().toISOString().split("T")[0];
  const filename = `seo-audit-${date}.md`;
  const filepath = path.join("reports", filename);

  if (!fs.existsSync("reports")) {
    fs.mkdirSync("reports");
  }

  fs.writeFileSync(filepath, content);
  console.log(`\n📄 SEO report saved to ${filepath}`);
  return filepath;
}