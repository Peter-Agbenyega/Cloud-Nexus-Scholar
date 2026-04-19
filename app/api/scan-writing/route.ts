import { NextResponse } from "next/server";

type ScanWritingRequestBody = {
  text?: unknown;
};

type AnthropicResponse = {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
};

export const runtime = "nodejs";

const anthropicUrl = "https://api.anthropic.com/v1/messages";
const systemPrompt = `You are an elite academic writing integrity analyst combining 
AI detection and plagiarism-style analysis similar to Turnitin. 
You analyze student writing across four dimensions:

1. AI DETECTION — Does this sound AI-generated? Look for: overly 
   formal transitions, generic phrasing, perfectly balanced 
   sentence structure, lack of personal voice, absence of specific 
   examples, unnaturally smooth flow.

2. PATCHWRITING DETECTION — Has the student taken source material 
   and just swapped a few words? Patchwriting looks like: awkward 
   phrasing that mixes formal and informal tone, sentences that 
   feel borrowed but paraphrased, ideas stated without any 
   personal interpretation.

3. CITATION GAP ANALYSIS — Identify every sentence that makes a 
   factual claim, references a concept, cites a statistic, or 
   builds on external knowledge WITHOUT an APA citation. UMGC 
   requires APA format. Flag every claim that needs a citation 
   but does not have one.

4. VOICE CONSISTENCY — Does the writing sound like one consistent 
   person throughout? Flag sudden shifts in vocabulary level, 
   tone, or sentence complexity that suggest content was copied 
   or generated from multiple sources.

You must respond ONLY with a valid JSON object. 
No preamble. No explanation. No markdown code fences. 
Raw JSON only.

The JSON must follow this exact structure:
{
  aiScore: number,
  plagiarismRisk: number,
  citationScore: number,
  voiceScore: number,
  overallScore: number,
  verdict: string,
  summary: string,
  sentences: [
    {
      text: string,
      aiFlag: boolean,
      aiReason: string,
      patchwritingFlag: boolean,
      patchwritingReason: string,
      citationFlag: boolean,
      citationReason: string,
      voiceFlag: boolean,
      voiceReason: string,
      riskLevel: string
    }
  ],
  citationGaps: [
    {
      sentence: string,
      suggestedCitation: string
    }
  ],
  advice: string,
  preSubmissionChecklist: [
    {
      item: string,
      passed: boolean,
      note: string
    }
  ]
}

Scoring rules:
- aiScore: 0-100. How AI-generated does this sound.
- plagiarismRisk: 0-100. How much patchwriting or voice 
  inconsistency exists.
- citationScore: 0-100. 100 = all claims properly cited. 
  0 = no citations where needed.
- voiceScore: 0-100. 100 = perfectly consistent personal voice.
  0 = completely inconsistent.
- overallScore: weighted average: 
  (aiScore * 0.35) + (plagiarismRisk * 0.25) + 
  ((100 - citationScore) * 0.25) + ((100 - voiceScore) * 0.15)
  Round to nearest integer.
- verdict: exactly one of: 
  Clear | Needs Work | High Risk | Do Not Submit
  - overallScore < 20: Clear
  - overallScore 20-39: Needs Work
  - overallScore 40-59: High Risk
  - overallScore >= 60: Do Not Submit

- sentences: analyze every sentence individually.
  riskLevel must be exactly one of: clean | low | medium | high
  
- citationGaps: list every sentence that needs a citation but 
  lacks one. For suggestedCitation, write a placeholder APA 
  format example like: (Author, Year) or (Author et al., Year)

- preSubmissionChecklist must contain exactly these 6 items 
  evaluated honestly:
  1. 'Writing sounds like my own authentic voice'
  2. 'All factual claims have APA citations'
  3 'No sentences appear patchwritten from sources'
  4. 'Consistent academic tone throughout'
  5. 'Personal examples or real experience included'
  6. 'Safe to submit to UMGC without academic integrity risk'

- advice: 3-5 specific actionable sentences telling Peter 
  exactly what to fix before submitting. Reference UMGC 
  academic standards. Be direct and honest.`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "API key not configured" }, { status: 500 });
    }

    const body = (await request.json()) as ScanWritingRequestBody;

    if (!body || typeof body.text !== "string") {
      return NextResponse.json({ ok: false, error: "Invalid request payload" }, { status: 400 });
    }

    const anthropicResponse = await fetch(anthropicUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Analyze this UMGC graduate student writing:\n\n${body.text}`,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();

      return NextResponse.json(
        { ok: false, error: "Anthropic request failed", details: errorText },
        { status: 500 },
      );
    }

    const payload = (await anthropicResponse.json()) as AnthropicResponse;
    const responseText = payload.content
      ?.filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!responseText) {
      return NextResponse.json({ ok: false, error: "Failed to parse analysis" }, { status: 500 });
    }

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json(parsed, { status: 200 });
    } catch {
      return NextResponse.json({ ok: false, error: "Failed to parse analysis" }, { status: 500 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown scan writing route error.";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
