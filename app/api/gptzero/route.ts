import { NextResponse } from "next/server";

type GptZeroRequestBody = {
  text?: unknown;
};

type GptZeroSentence = {
  sentence?: string;
  generated_prob?: number;
  perplexity?: number;
};

type GptZeroDocument = {
  average_generated_prob?: number;
  completely_generated_prob?: number;
  overall_burstiness?: number;
  sentences?: GptZeroSentence[];
};

type GptZeroResponse = {
  documents?: GptZeroDocument[];
};

export const runtime = "nodejs";

const gptZeroUrl = "https://api.gptzero.me/v2/predict/text";

function normalizeScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value * 100));
}

function getVerdict(score: number) {
  if (score < 20) {
    return "Human";
  }

  if (score < 60) {
    return "Mixed";
  }

  return "AI-Generated";
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GPTZERO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "GPTZERO_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GptZeroRequestBody;

    if (!body || typeof body.text !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid request payload. Expected { text: string }." },
        { status: 400 },
      );
    }

    const gptZeroResponse = await fetch(gptZeroUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.GPTZERO_API_KEY as string,
      },
      body: JSON.stringify({
        document: body.text,
        multilingual: false,
      }),
    });

    if (!gptZeroResponse.ok) {
      const errorText = await gptZeroResponse.text();

      return NextResponse.json(
        {
          ok: false,
          error: "GPTZero request failed",
          details: errorText,
        },
        { status: 500 },
      );
    }

    const payload = (await gptZeroResponse.json()) as GptZeroResponse;
    const document = payload.documents?.[0];
    const score = normalizeScore(document?.average_generated_prob);

    return NextResponse.json({
      ok: true,
      score,
      verdict: getVerdict(score),
      sentences: (document?.sentences ?? []).map((sentence) => {
        const sentenceScore = normalizeScore(sentence.generated_prob);

        return {
          text: typeof sentence.sentence === "string" ? sentence.sentence : "",
          score: sentenceScore,
          flagged: sentenceScore > 75,
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown GPTZero route error.";

    return NextResponse.json(
      { ok: false, error: "GPTZero route failed", details: message },
      { status: 500 },
    );
  }
}
