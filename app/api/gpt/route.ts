import { NextResponse } from "next/server";

type GptMode = "explain" | "alternative" | "simplify" | "challenge";

type GptRequestBody = {
  messages: { role: "user" | "assistant"; content: string }[];
  courseCode: string;
  topicTitle: string;
  mode: GptMode;
};

type OpenAIStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
};

export const runtime = "nodejs";

const openAiUrl = "https://api.openai.com/v1/chat/completions";

function buildSystemPrompt({ courseCode, topicTitle, mode }: Omit<GptRequestBody, "messages">) {
  const prompts: Record<GptMode, string> = {
    explain: `You are a second AI tutor for Peter Agbenyega, a UMGC
graduate student in Cloud Computing Systems with AWS
certifications (SAA-C03, SAP-C02, SCS-C02) and
production DevSecOps experience. Explain the concept
clearly at graduate level. Connect to AWS and
Kubernetes where relevant. Be concise and practical.
Current context: ${courseCode} — ${topicTitle}`,
    alternative: `Give Peter a completely different way of understanding
this concept. Use a different analogy, different
examples, different framing than a standard textbook.
Make it memorable and grounded in real cloud
engineering practice.`,
    simplify: `Break this down to absolute fundamentals. No jargon.
Pure clear logic. Then build back up to the graduate
level version in three steps.`,
    challenge: `Challenge Peter's understanding. Ask him 3 probing
questions about this concept that would reveal gaps
in his knowledge. Be a tough but fair examiner.`,
  };

  return prompts[mode];
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = (await request.json()) as GptRequestBody;

    if (
      !body ||
      !Array.isArray(body.messages) ||
      typeof body.courseCode !== "string" ||
      typeof body.topicTitle !== "string" ||
      !["explain", "alternative", "simplify", "challenge"].includes(body.mode) ||
      body.messages.some(
        (message) =>
          !message ||
          (message.role !== "user" && message.role !== "assistant") ||
          typeof message.content !== "string",
      )
    ) {
      return NextResponse.json({ error: "Invalid GPT request payload." }, { status: 400 });
    }

    const openAiResponse = await fetch(openAiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 800,
        stream: true,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(body),
          },
          ...body.messages.slice(-10),
        ],
      }),
    });

    if (!openAiResponse.ok || !openAiResponse.body) {
      const errorText = await openAiResponse.text();
      return NextResponse.json(
        { error: "OpenAI request failed", details: errorText },
        { status: 500 },
      );
    }

    const reader = openAiResponse.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) {
                continue;
              }

              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }

              try {
                const parsed = JSON.parse(data) as OpenAIStreamChunk;
                const deltaText = parsed.choices?.[0]?.delta?.content;

                if (!deltaText) {
                  continue;
                }

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "content_block_delta",
                      delta: {
                        type: "text_delta",
                        text: deltaText,
                      },
                    })}\n\n`,
                  ),
                );
              } catch {
                // Skip malformed upstream SSE lines.
              }
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
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
    const message = error instanceof Error ? error.message : "Unknown GPT route error.";
    return NextResponse.json({ error: "GPT route failed", details: message }, { status: 500 });
  }
}
