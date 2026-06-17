import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";

export interface PageAudit {
  url: string;
  canonical: string | null;
  canonicalIssue: boolean;
  metaDescription: string | null;
  title: string | null;
  statusCode: number;
}

export interface SEOReport {
  baseUrl: string;
  crawledPages: PageAudit[];
  issues: string[];
  has404Page: boolean;
}

async function checkUrl(url: string): Promise<number> {
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return response.status;
  } catch {
    return 0;
  }
}

async function auditPage(url: string): Promise<PageAudit> {
  try {
    const response = await axios.get(url, {
      validateStatus: () => true,
    });

    const $ = cheerio.load(response.data);
    const canonical = $('link[rel="canonical"]').attr("href") || null;
    const metaDescription =
      $('meta[name="description"]').attr("content") || null;
    const title = $("title").text() || null;

    const canonicalIssue =
      canonical !== null && canonical !== url && canonical !== url + "/";

    return {
      url,
      canonical,
      canonicalIssue,
      metaDescription,
      title,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      url,
      canonical: null,
      canonicalIssue: false,
      metaDescription: null,
      title: null,
      statusCode: 0,
    };
  }
}

async function discoverLinks(
  baseUrl: string,
  html: string
): Promise<string[]> {
  const $ = cheerio.load(html);
  const links = new Set<string>();
  const base = new URL(baseUrl);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const resolved = new URL(href, baseUrl);
      if (resolved.hostname === base.hostname) {
        resolved.hash = "";
        links.add(resolved.toString());
      }
    } catch {
      // invalid url, skip
    }
  });

  return Array.from(links);
}

export async function crawlSite(baseUrl: string): Promise<SEOReport> {
  console.log(`\n🔍 Starting SEO crawl of ${baseUrl}...\n`);

  const visited = new Set<string>();
  const queue: string[] = [baseUrl];
  const audits: PageAudit[] = [];
  const issues: string[] = [];

  // check for 404 page
  const fake404Url = `${baseUrl}/this-page-definitely-does-not-exist-12345`;
  const fake404Status = await checkUrl(fake404Url);
  const has404Page = fake404Status === 404;

  if (!has404Page) {
    issues.push(
      `No custom 404 page — ${fake404Url} returned ${fake404Status} instead of 404`
    );
  }

  while (queue.length > 0) {
    const url = queue.shift()!;

    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`  Crawling: ${url}`);
    const audit = await auditPage(url);
    audits.push(audit);

    if (audit.canonicalIssue) {
      issues.push(
        `Canonical mismatch on ${url} — points to ${audit.canonical} instead of itself`
      );
    }

    if (!audit.metaDescription) {
      issues.push(`Missing meta description on ${url}`);
    }

    if (!audit.title) {
      issues.push(`Missing title tag on ${url}`);
    }

    // discover more links from this page
    if (audit.statusCode === 200) {
      try {
        const response = await axios.get(url);
        const newLinks = await discoverLinks(baseUrl, response.data);
        for (const link of newLinks) {
          if (!visited.has(link)) {
            queue.push(link);
          }
        }
      } catch {
        // skip if we can't fetch
      }
    }
  }

  return {
    baseUrl,
    crawledPages: audits,
    issues,
    has404Page,
  };
}