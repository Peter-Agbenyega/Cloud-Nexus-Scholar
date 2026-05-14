import { NextResponse } from "next/server";

type SearchType =
  | "concept"
  | "definition"
  | "example"
  | "news"
  | "paper"
  | "documentation";

type SearchRequestBody = {
  query: string;
  courseCode: string;
  searchType: SearchType;
};

type PerplexityResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  citations?: string[];
};

export const runtime = "nodejs";

const perplexityUrl = "https://api.perplexity.ai/chat/completions";

function buildUserMessage({ query, searchType }: Pick<SearchRequestBody, "query" | "searchType">) {
  const prompts: Record<SearchType, string> = {
    concept: `Find the authoritative definition and explanation of: ${query}. Include official sources.`,
    definition: `Find the official NIST, IEEE, or industry-standard definition of: ${query}`,
    example: `Find real-world examples of ${query} in production cloud environments with sources.`,
    news: `Find the latest developments and news about ${query} in cloud computing in 2026.`,
    paper: `Find academic papers and research on ${query} relevant to graduate-level cloud study.`,
    documentation: `Find the official AWS, Azure, or GCP documentation for ${query} with links.`,
  };

  return prompts[searchType];
}

function extractSources(content: string, citations?: string[]) {
  const urlMatches = content.match(/https?:\/\/[^\s)>\]]+/g) ?? [];
  const cleaned = [...urlMatches, ...(citations ?? [])]
    .map((source) => source.replace(/[.,;:]+$/, ""))
    .filter(Boolean);

  return [...new Set(cleaned)];
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "PERPLEXITY_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as SearchRequestBody;

    if (
      !body ||
      typeof body.query !== "string" ||
      typeof body.courseCode !== "string" ||
      !["concept", "definition", "example", "news", "paper", "documentation"].includes(
        body.searchType,
      )
    ) {
      return NextResponse.json({ error: "Invalid search request payload." }, { status: 400 });
    }

    const perplexityResponse = await fetch(perplexityUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: `You are a real-time research assistant for Peter
Agbenyega, a UMGC graduate student in Cloud Computing
Systems. Search for accurate, current, cited
information. Always include source URLs. Prioritize:
official documentation (NIST, AWS, Azure, GCP),
peer-reviewed papers, and reputable industry sources.
Never hallucinate. If unsure, say so and provide
the best available real source. Format responses
clearly with sources listed at the bottom.`,
          },
          {
            role: "user",
            content: `${buildUserMessage(body)}\n\nCourse context: ${body.courseCode}`,
          },
        ],
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      return NextResponse.json(
        { error: "Perplexity request failed", details: errorText },
        { status: 500 },
      );
    }

    const payload = (await perplexityResponse.json()) as PerplexityResponse;
    const answer = payload.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json({ error: "Failed to parse search answer" }, { status: 500 });
    }

    return NextResponse.json(
      {
        answer,
        sources: extractSources(answer, payload.citations),
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown search route error.";
    return NextResponse.json({ error: "Search route failed", details: message }, { status: 500 });
  }
}
