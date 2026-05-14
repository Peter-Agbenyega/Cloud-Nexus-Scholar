import { NextResponse } from "next/server";

import type {
  ScholarPipelineMode,
  ScholarPipelineResult,
} from "@/lib/scholar-pipeline";
import { isScholarCourseCode } from "@/lib/scholar-pipeline";

type PipelineRequestBody = {
  question: string;
  courseCode: "CLCS 605" | "CLCS 615" | "CLCS 625" | "CLCS 635" | "CLCS 645";
  topicTitle: string;
  mode: ScholarPipelineMode;
};

type PipelineClaudePayload = {
  finalAnswer?: string;
  rubricCheck?: string;
  confidence?: number;
};

export const runtime = "nodejs";

const openAiUrl = "https://api.openai.com/v1/chat/completions";
const perplexityUrl = "https://api.perplexity.ai/chat/completions";
const anthropicUrl = "https://api.anthropic.com/v1/messages";

function getModeInstruction(mode: ScholarPipelineMode) {
  if (mode === "discussion") {
    return "Write this as a polished discussion-ready response in Peter's voice with strong analysis and natural phrasing.";
  }

  if (mode === "quiz") {
    return "Turn this into a quiz coaching response with direct answers, short explanations, and likely follow-up questions.";
  }

  return "Write this as a polished final answer Peter can adapt quickly for class submission.";
}

async function generateGptDraft(body: PipelineRequestBody) {
  const response = await fetch(openAiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: `You are creating a first-pass academic draft for Peter Agbenyega.
Current course: ${body.courseCode}
Current topic: ${body.topicTitle}
${getModeInstruction(body.mode)}
COMPLETED COURSES (Summer 2026):
CLCS 605 — Introduction to Cloud Computing:
ALL 8 UNITS COMPLETE. Grade: A projected.

CLCS 615 — Cloud Services and Technologies:
ALL 8 UNITS COMPLETE. Grade: A projected.

FALL 2026 UPCOMING:
CLCS 625 — Cloud Security and Compliance
CLCS 635 — Cloud Infrastructure Management
CLCS 645 — Advanced Cloud Architecture

When helping with Fall courses, apply everything Peter learned in Summer 2026 as relevant context.
Connect new concepts to what he already mastered.
Keep it practical, specific, and grounded in cloud computing.`,
        },
        {
          role: "user",
          content: body.question,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("GPT-4o draft stage failed.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

async function gatherSources(body: PipelineRequestBody) {
  const response = await fetch(perplexityUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "You are a research assistant. Return concise research notes with source URLs. Prefer NIST, official cloud docs, peer-reviewed papers, and reputable industry sources.",
        },
        {
          role: "user",
          content: `Question: ${body.question}
Course: ${body.courseCode}
Topic: ${body.topicTitle}
Return concise notes and source URLs Peter can rely on.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Sources stage failed.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };
  const answer = payload.choices?.[0]?.message?.content?.trim() ?? "";
  const urls = [
    ...(answer.match(/https?:\/\/[^\s)>\]]+/g) ?? []),
    ...(payload.citations ?? []),
  ].map((url) => url.replace(/[.,;:]+$/, ""));

  return {
    notes: answer,
    sources: [...new Set(urls)].slice(0, 8),
  };
}

async function generateFinalAnswer(
  body: PipelineRequestBody,
  gptDraft: string,
  notes: string,
  sources: string[],
) {
  const response = await fetch(anthropicUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1800,
      system: `You are Professor Scholar, Peter Agbenyega's private academic mentor.
Course: ${body.courseCode}
Topic: ${body.topicTitle}
Mode: ${body.mode}
COMPLETED COURSES (Summer 2026):
CLCS 605 — Introduction to Cloud Computing:
ALL 8 UNITS COMPLETE. Grade: A projected.

CLCS 615 — Cloud Services and Technologies:
ALL 8 UNITS COMPLETE. Grade: A projected.

FALL 2026 UPCOMING:
CLCS 625 — Cloud Security and Compliance
CLCS 635 — Cloud Infrastructure Management
CLCS 645 — Advanced Cloud Architecture

When helping with Fall courses, apply everything Peter learned in Summer 2026 as relevant context.
Connect new concepts to what he already mastered.
Use Peter's voice: direct, specific, graduate-level, practical, and natural.
Use the research notes for accuracy but do not fabricate citations.
Return JSON only with keys: finalAnswer, rubricCheck, confidence.`,
      messages: [
        {
          role: "user",
          content: `Original question:
${body.question}

GPT draft:
${gptDraft}

Research notes:
${notes}

Sources:
${sources.join("\n")}

Rubric check should explain how well the answer fits the likely assignment, where Peter should personalize it, and what to verify before submitting.
Confidence must be an integer from 0 to 100.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Claude stage failed.");
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const rawText =
    payload.content
      ?.filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text)
      .join("")
      .trim() ?? "";

  if (!rawText) {
    throw new Error("Claude returned an empty response.");
  }

  try {
    const parsed = JSON.parse(rawText) as PipelineClaudePayload;
    return {
      finalAnswer: parsed.finalAnswer ?? gptDraft,
      rubricCheck:
        parsed.rubricCheck ??
        "Review course instructions, personalize with your own examples, and verify every factual claim.",
      confidence:
        typeof parsed.confidence === "number" ? Math.max(0, Math.min(100, parsed.confidence)) : 84,
    };
  } catch {
    return {
      finalAnswer: rawText,
      rubricCheck:
        "Claude did not return structured rubric feedback. Review fit, citations, and personalization before submitting.",
      confidence: 80,
    };
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY || !process.env.PERPLEXITY_API_KEY || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Pipeline API keys are not fully configured." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as PipelineRequestBody;

    if (
      !body ||
      typeof body.question !== "string" ||
      !body.question.trim() ||
      !isScholarCourseCode(body.courseCode) ||
      typeof body.topicTitle !== "string" ||
      !["full", "discussion", "quiz"].includes(body.mode)
    ) {
      return NextResponse.json({ error: "Invalid pipeline request payload." }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          send({ type: "stage", stage: "GPT-4o" });
          const gptDraft = await generateGptDraft(body);

          send({ type: "stage", stage: "Sources" });
          const sourceResult = await gatherSources(body);

          send({ type: "stage", stage: "Claude" });
          const claudeResult = await generateFinalAnswer(
            body,
            gptDraft,
            sourceResult.notes,
            sourceResult.sources,
          );

          const result: ScholarPipelineResult = {
            finalAnswer: claudeResult.finalAnswer,
            sources: sourceResult.sources,
            rubricCheck: claudeResult.rubricCheck,
            confidence: claudeResult.confidence,
            gptDraft,
          };

          send({ type: "stage", stage: "Done" });
          send({ type: "result", result });
          send("[DONE]");
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "The pipeline failed unexpectedly.";
          send({ type: "error", error: message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline route error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
