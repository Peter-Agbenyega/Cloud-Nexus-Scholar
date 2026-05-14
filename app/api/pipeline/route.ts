export const runtime = "nodejs";

type PipelineMode = "assignment" | "concept" | "discussion" | "quiz";

type PipelineRequestBody = {
  question: string;
  courseCode: string;
  topicTitle: string;
  assignmentContext?: string;
  rubric?: Record<string, number>;
  mode: PipelineMode;
};

type SourceRecord = {
  title: string;
  url: string;
};

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const VALID_MODES: PipelineMode[] = ["assignment", "concept", "discussion", "quiz"];

function isValidPipelineBody(body: unknown): body is PipelineRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as Record<string, unknown>;
  const rubric = candidate.rubric;

  const rubricIsValid =
    typeof rubric === "undefined" ||
    (typeof rubric === "object" &&
      rubric !== null &&
      Object.values(rubric).every((value) => typeof value === "number"));

  return (
    typeof candidate.question === "string" &&
    typeof candidate.courseCode === "string" &&
    typeof candidate.topicTitle === "string" &&
    (typeof candidate.assignmentContext === "undefined" ||
      typeof candidate.assignmentContext === "string") &&
    rubricIsValid &&
    typeof candidate.mode === "string" &&
    VALID_MODES.includes(candidate.mode as PipelineMode)
  );
}

function sseEvent(payload: Record<string, unknown>) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function extractNeedsSourceTopics(input: string) {
  const matches = [...input.matchAll(/\[NEEDS_SOURCE:\s*([^\]]+)\]/gi)];
  return matches.map((match) => match[1]?.trim()).filter(Boolean) as string[];
}

function normalizeDraft(input: string) {
  return input.replace(/\[NEEDS_SOURCE:\s*[^\]]+\]/gi, "").replace(/\n{3,}/g, "\n\n").trim();
}

function parseSourcesFromText(input: string) {
  const matches = [
    ...input.matchAll(/SOURCE:\s*(.+?)\s*\|\s*(https?:\/\/[^\s|]+[^\s.,;)\]])/gi),
  ];

  return matches.map((match) => ({
    title: match[1].trim(),
    url: match[2].trim(),
  }));
}

function dedupeSources(sources: SourceRecord[]) {
  const seen = new Set<string>();
  const next: SourceRecord[] = [];

  for (const source of sources) {
    const key = source.url.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      next.push(source);
    }
  }

  return next;
}

function formatSourceForPrompt(source: SourceRecord) {
  return `${source.title} | ${source.url}`;
}

function extractTaggedSection(input: string, tag: string) {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\[${escapedTag}\\]([\\s\\S]*?)(?=\\n\\[[A-Z ]+\\]|$)`, "i");
  const match = input.match(regex);
  return match?.[1]?.trim() ?? "";
}

async function callOpenAI(body: PipelineRequestBody, apiKey: string) {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are the first stage of an academic pipeline for Peter Agbenyega, UMGC graduate student in Cloud Computing Systems. AWS certified (SAA-C03, SAP-C02, SCS-C02). DevSecOps engineer.
Course: ${body.courseCode} Topic: ${body.topicTitle}

Your job in this pipeline:
1. Answer the question clearly at graduate level
2. Structure the answer logically
3. Flag where real sources or citations are needed by writing [NEEDS_SOURCE: topic] in your response
4. Keep your answer to 3-4 paragraphs maximum
5. Connect to Peter's AWS and DevSecOps experience`,
        },
        {
          role: "user",
          content: body.question,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (errorText.includes("model_not_found")) {
      throw new Error(
        `OpenAI model access failed for "${OPENAI_MODEL}". Set OPENAI_MODEL in Vercel to an allowed model such as gpt-4o-mini.`,
      );
    }

    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callPerplexity(topic: string, apiKey: string) {
  const response = await fetch(PERPLEXITY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-large-128k-online",
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "Find authoritative sources for academic use. Return only real URLs from official sources: NIST, AWS docs, IEEE, ACM, peer-reviewed journals. Format: SOURCE: [title] | [url]",
        },
        {
          role: "user",
          content: `Find sources for: ${topic} in context of cloud computing graduate study`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity request failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callClaude(params: {
  body: PipelineRequestBody;
  apiKey: string;
  gptDraft: string;
  sources: SourceRecord[];
}) {
  const { body, apiKey, gptDraft, sources } = params;
  const assignmentLine = body.assignmentContext
    ? `Assignment context: ${body.assignmentContext}`
    : "";
  const rubricLine = body.rubric
    ? `Rubric criteria to address: ${JSON.stringify(body.rubric)}`
    : "";

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: `You are the final stage of an academic pipeline for Peter Agbenyega. Your job is to take the GPT draft and the found sources and produce ONE polished final answer.

Peter's profile: UMGC MS Cloud Computing Systems. AWS SAA-C03, SAP-C02, SCS-C02. Daily production work with Docker, Kubernetes, EKS, ArgoCD, Trivy, Gitleaks, Checkov, SonarCloud, OWASP ZAP.
Course: ${body.courseCode} | Topic: ${body.topicTitle}

${assignmentLine}
${rubricLine}

Your review must:
1. Critically evaluate the GPT draft for accuracy
2. Correct any errors or oversimplifications
3. Integrate the real sources naturally with APA-style citations
4. Connect concepts to Peter's real AWS experience
5. Ensure the response addresses every rubric criterion if a rubric was provided
6. Remove all AI red flag phrases:
   in conclusion, it is important to note,
   furthermore, in today's digital landscape,
   leveraging, it is worth noting, as we can see
7. Make the writing sound like an experienced
   cloud professional who is also a graduate
   student — not a textbook, not a robot
8. End with a confidence note: one sentence
   telling Peter what is strong about this
   response and one thing to verify

Format the final answer clearly with:
- Main response paragraphs
- [SOURCES] section at the bottom listing
  all real citations in APA format
- [RUBRIC CHECK] section showing which rubric
  criteria this response addresses
- [CONFIDENCE] one sentence on strength and
  one on what to verify`,
      messages: [
        {
          role: "user",
          content: `GPT Draft: ${gptDraft}

Found Sources: ${
            sources.length > 0
              ? sources.map(formatSourceForPrompt).join(", ")
              : "Live search unavailable or not required."
          }

Original Question: ${body.question}

Produce the final polished response.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    content?: { type?: string; text?: string }[];
  };

  return (
    payload.content
      ?.filter((item) => item.type === "text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim() ?? ""
  );
}

export async function POST(request: Request) {
  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const rawBody = (await request.json()) as unknown;

    if (!isValidPipelineBody(rawBody)) {
      return Response.json({ error: "Invalid pipeline request payload." }, { status: 400 });
    }

    const body = rawBody;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const enqueue = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(sseEvent(payload)));
        };

        try {
          const openaiApiKey = process.env.OPENAI_API_KEY;
          const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

          let gptDraft = body.question.trim();
          let sourceTopics: string[] = [];

          if (openaiApiKey) {
            enqueue({ stage: "gpt", status: "running" });
            const openAiDraft = await callOpenAI(body, openaiApiKey);
            gptDraft = normalizeDraft(openAiDraft || body.question.trim());
            sourceTopics = extractNeedsSourceTopics(openAiDraft);
          }

          let sources: SourceRecord[] = [];
          const shouldRunSearch =
            sourceTopics.length > 0 || body.mode === "assignment" || body.mode === "discussion";

          if (shouldRunSearch) {
            enqueue({ stage: "search", status: "running" });

            if (!perplexityApiKey) {
              sources = [{ title: "Live search unavailable", url: "" }];
            } else {
              const topicsToSearch =
                sourceTopics.length > 0 ? sourceTopics.slice(0, 3) : [body.topicTitle];
              const searchResults = await Promise.all(
                topicsToSearch.map((topic) => callPerplexity(topic, perplexityApiKey)),
              );
              sources = dedupeSources(
                searchResults.flatMap((result) => parseSourcesFromText(result)).slice(0, 9),
              );
            }
          }

          enqueue({ stage: "claude", status: "running" });
          const finalAnswer = await callClaude({
            body,
            apiKey: anthropicApiKey,
            gptDraft,
            sources: sources.filter((source) => Boolean(source.url)),
          });

          enqueue({
            stage: "complete",
            content: finalAnswer,
            gptDraft,
            sources: sources.map((source) =>
              source.url ? formatSourceForPrompt(source) : source.title,
            ),
            finalAnswer,
            rubricCheck: extractTaggedSection(finalAnswer, "RUBRIC CHECK"),
            confidence: extractTaggedSection(finalAnswer, "CONFIDENCE"),
          });
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown pipeline route error.";
          enqueue({ stage: "error", message });
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
    return Response.json({ error: "Pipeline route failed", details: message }, { status: 500 });
  }
}
