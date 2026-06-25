import OpenAI from "openai";
import * as dotenv from "dotenv";
// when a potential customer asks an AI assistant about your product category, does your brand show up?

dotenv.config(); //reads the .env file and loads every key-value pair into process.env.

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
  mentionRate: number; //number between 0 and 1, not a percentage
  topCompetitors: { name: string; count: number }[];
}

function extractCompetitors(text: string, competitors: string[]): string[] {
  const lower = text.toLowerCase();
  return competitors.filter((competitor) =>
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

  while (true) { //loop till you catch all mentions
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
  competitors: string[]
): Promise<AEOReport> {
  console.log(`\n🔍 Starting AEO audit for ${brand}...\n`);

  const results: QueryResult[] = [];

  for (const query of queries) {
    const response = await queryLLM(query);
    const brandMentioned = checkBrandMention(response, brand);
    const mentionCount = countMentions(response, brand);
    const mentionedCompetitors = extractCompetitors(response, competitors);

    results.push({
      query,
      response,
      brandMentioned,
      mentionCount,
      competitors: mentionedCompetitors,
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