import * as dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { crawlSite } from "./seo/crawler";
import { saveSEOReport } from "./seo/reporter";
import { runAEOAudit } from "./aeo/tracker";
import { saveAEOReport } from "./aeo/reporter";

dotenv.config();

const argv = yargs(hideBin(process.argv))
  .option("brand", {
    alias: "b",
    type: "string",
    description: "Brand name to audit",
    demandOption: true,
  })
  .option("url", {
    alias: "u",
    type: "string",
    description: "Brand website URL",
    demandOption: true,
  })
  .option("queries", {
    alias: "q",
    type: "string",
    description: "Comma separated list of search queries to run",
    demandOption: true,
  })
  .option("competitors", {
    alias: "c",
    type: "string",
    description: "Comma separated list of known competitors",
    demandOption: false,
  })
  .parseSync();

async function main() {
  const brand = argv.brand as string;
  const url = argv.url as string;
  const queries = (argv.queries as string).split(",").map((q) => q.trim());
  const competitors = argv.competitors
    ? (argv.competitors as string).split(",").map((c) => c.trim().toLowerCase())
    : [];

  console.log(`\n🚀 Starting audit for ${brand} (${url})\n`);
  console.log("=".repeat(60));
  console.log(`   Queries: ${queries.length}`);
  console.log(`   Competitors tracked: ${competitors.length || "using defaults"}`);

  // run SEO crawl
  console.log("\n📡 Running SEO Audit...");
  const seoReport = await crawlSite(url);
  const seoPath = saveSEOReport(seoReport);

  console.log(`\n✅ SEO Audit complete`);
  console.log(`   Pages crawled: ${seoReport.crawledPages.length}`);
  console.log(`   Issues found: ${seoReport.issues.length}`);

  // run AEO audit
  console.log("\n📡 Running AEO Audit...");
  const aeoReport = await runAEOAudit(brand, url, queries, competitors);
  const aeoPath = saveAEOReport(aeoReport);

  console.log(`\n✅ AEO Audit complete`);
  console.log(`   Queries run: ${aeoReport.queries.length}`);
  console.log(`   Mention rate: ${Math.round(aeoReport.mentionRate * 100)}%`);
  console.log(`   Top competitors: ${aeoReport.topCompetitors.slice(0, 3).map((c) => c.name).join(", ")}`);

  console.log("\n" + "=".repeat(60));
  console.log(`\n📁 Reports saved:`);
  console.log(`   ${seoPath}`);
  console.log(`   ${aeoPath}`);
  console.log("\n✨ Audit complete!\n");
}

main().catch(console.error);