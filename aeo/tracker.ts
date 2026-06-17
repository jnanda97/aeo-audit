import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export interface QueryResult {
  query: string;
  response: string;
  brandMentioned: boolean;
  mentionCount: number;
  competitors: string[];
}

export interface AEOReport {
  brand: string;
  domain: string;
  queries: QueryResult[];
  totalMentions: number;
  mentionRate: number;
  topCompetitors: { name: string; count: number }[];
}

const KNOWN_COMPETITORS = [
  "poshmark",
  "depop",
  "therealreal",
  "the real real",
  "vestiaire",
  "rent the runway",
  "nuuly",
  "stitch fix",
  "thredup",
  "vinted",
  "by rotation",
  "pickle",
  "stockx",
  "grailed",
  "tradesy",
  "moda operandi",
];

function extractCompetitors(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_COMPETITORS.filter((competitor) =>
    lower.includes(competitor)
  );
}

function checkBrandMention(text: string, brand: string): boolean {
  return text.toLowerCase().includes(brand.toLowerCase());
}

function countMentions(text: string, brand: string): number {
  const lower = text.toLowerCase();
  const brandLower = brand.toLowerCase();
  let count = 0;
  let index = 0;

  while (true) {
    index = lower.indexOf(brandLower, index);
    if (index === -1) break;
    count++;
    index += brandLower.length;
  }

  return count;
}

async function queryLLM(prompt: string): Promise<string> {
  console.log(`\n  🤖 Querying LLM: "${prompt}"`);

  const response = await client.chat.completions.create({
    model: "grok-3-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer questions naturally and comprehensively as a consumer would expect.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 1000,
  });

  return response.choices[0].message.content || "";
}

export async function runAEOAudit(
  brand: string,
  domain: string,
  queries: string[],
  competitors: string[] = KNOWN_COMPETITORS
): Promise<AEOReport> {
  console.log(`\n🔍 Starting AEO audit for ${brand}...\n`);

  const results: QueryResult[] = [];

  for (const query of queries) {
    const response = await queryLLM(query);
    const brandMentioned = checkBrandMention(response, brand);
    const mentionCount = countMentions(response, brand);
    const competitors = extractCompetitors(response);

    results.push({
      query,
      response,
      brandMentioned,
      mentionCount,
      competitors,
    });

    // small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // calculate total mentions and mention rate
  const totalMentions = results.reduce((sum, r) => sum + r.mentionCount, 0);
  const mentionRate = results.filter((r) => r.brandMentioned).length / results.length;

  // tally competitor mentions across all queries
  const competitorCounts: Record<string, number> = {};
  for (const result of results) {
    for (const competitor of result.competitors) {
      competitorCounts[competitor] = (competitorCounts[competitor] || 0) + 1;
    }
  }

  const topCompetitors = Object.entries(competitorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    brand,
    domain,
    queries: results,
    totalMentions,
    mentionRate,
    topCompetitors,
  };
}