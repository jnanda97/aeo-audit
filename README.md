# ZeroMention - AI Search Visibility Auditor

A command-line tool that audits a brand's visibility in AI search engines (AEO) and traditional SEO health. Built to answer the question: _when potential customers ask AI assistants about your product category, does your brand show up?_

## Background

Traditional SEO tools tell you how you rank on Google. But as more consumers turn to AI assistants to discover products, a brand can have perfect SEO and still be invisible in AI search. This tool measures that gap.

The inspiration came from discovering [Petra Labs](https://www.petralabs.com), a company helping businesses improve their visibility in AI search, and realizing a startup I'd been following could benefit from this kind of audit. I ran a manual audit on them and found that despite offering a genuinely novel product, they had zero mentions across AI search responses for relevant consumer queries while established competitors dominated every result.

That gap between product quality and AI visibility is what this tool is built to surface. I'm not affiliated with Petra Labs in any way, and I've kept the audited startup anonymous out of respect for their team.

## What it does

**SEO Module**

- Crawls every page on a site
- Checks for canonical tag misconfigurations
- Detects missing meta descriptions and title tags
- Identifies missing 404 pages
- Generates a markdown report

**AEO Module**

- Runs user-provided queries against an AI model (Grok)
- Checks whether your brand appears in the responses
- Tracks competitor share of voice
- Calculates a mention rate across all queries
- Generates a markdown report

## Prerequisites

- Node.js v18 or higher
- An API key from any OpenAI-compatible provider. Tested with:
  - [Grok](https://console.x.ai) 
  - [OpenAI](https://platform.openai.com)

## Setup

1. Clone the repo:

```bash
git clone https://github.com/yourusername/aeo-audit.git
cd aeo-audit
```

2. Install dependencies:

```bash
npm install
```

3. Create your `.env` file:

```bash
cp .env.example .env
```

4. Add your API key to `.env`, using grok here as an example:
   GROK_API_KEY=your_key_here

## Usage

```bash
npm run audit -- --brand "YOUR BRAND" --url "https://yourbrand.com" --queries "query one,query two,query three" --competitors "competitor1,competitor2,competitor3"
```

Here is a sample query using CFA:

### Options

| Flag          | Alias | Required | Description                               |
| ------------- | ----- | -------- | ----------------------------------------- |
| --brand       | -b    | yes      | Brand name to audit                       |
| --url         | -u    | yes      | Brand website URL                         |
| --queries     | -q    | yes      | Comma separated list of search queries    |
| --competitors | -c    | no       | Comma separated list of known competitors |

### Example

```bash
npm run audit -- \
  --brand "Chick-fil-A" \
  --url "https://www.chick-fil-a.com" \
  --queries "best fast food chicken sandwich,fast food restaurants with best customer service,healthy fast food options" \
  --competitors "mcdonalds,wendys,popeyes,raising canes,zaxbys"
```

## Output

Reports are saved to the `reports/` folder as markdown files:

- `reports/seo-audit-YYYY-MM-DD.md`
- `reports/aeo-audit-YYYY-MM-DD.md`

## Project Structure

aeo-audit/

├── index.ts # entry point, CLI argument parsing

├── seo/

│ ├── crawler.ts # crawls site, audits each page

│ └── reporter.ts # generates SEO markdown report

├── aeo/

│ ├── tracker.ts # queries Grok, tracks brand mentions

│ └── reporter.ts # generates AEO markdown report

└── reports/ # generated reports (gitignored)
