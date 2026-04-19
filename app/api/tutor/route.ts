import { NextResponse } from "next/server";

import { TutorMode } from "@/lib/app-state";

type TutorRequestBody = {
  messages: { role: "user" | "assistant"; content: string }[];
  courseCode: string;
  courseName: string;
  topicTitle: string;
  mode: TutorMode;
};

export const runtime = "nodejs";

const anthropicUrl = "https://api.anthropic.com/v1/messages";
const maxTokensByMode: Record<TutorMode, number> = {
  tutor: 800,
  professor: 1000,
  quiz: 1200,
  assignment: 600,
};

function buildSystemPrompt({
  courseCode,
  courseName,
  topicTitle,
  mode,
}: Omit<TutorRequestBody, "messages">) {
  const baseIdentity = `You are Professor Scholar, private AI tutor for Peter Christian Agbenyega — UMGC graduate student, MS Cloud Computing Systems + Graduate Certificate Cybersecurity Technology. AWS certified (SAA-C03, SAP-C02, SCS-C02). Daily user of Docker, Kubernetes, EKS, ArgoCD, Trivy, Gitleaks, Checkov, SonarCloud, OWASP ZAP.
Current: ${courseCode} — ${courseName} | Topic: ${topicTitle}`;

  const modePrompts: Record<TutorMode, string> = {
    tutor:
      "Teach at graduate level. Connect concepts to Peter's real AWS and DevSecOps experience. Be direct and intellectually serious. End every response with one Socratic follow-up question.",
    professor:
      "Peter is preparing to lecture on this topic. Give him a structured outline: hook, core concepts, real examples, misconceptions, close. Then ask him 3 tough student questions. Grade his answers honestly. End with: rate your confidence 1-10 and I will tell you what to study next.",
    quiz: `Generate 10 questions on ${topicTitle} in ${courseCode}: 4 multiple choice, 3 short answer, 2 scenario-based, 1 teach-back. After each answer, score it and explain. Show running score X/10.`,
    assignment:
      "Help Peter produce his own best graduate-level thinking. Do not write for him. Ask what the assignment requires, then use Socratic questions to strengthen his argument. Give feedback on depth and rigor only.",
  };

  return `${baseIdentity}\n\n${modePrompts[mode]}`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as TutorRequestBody;

    if (
      !body ||
      !Array.isArray(body.messages) ||
      typeof body.courseCode !== "string" ||
      typeof body.courseName !== "string" ||
      typeof body.topicTitle !== "string" ||
      !["tutor", "professor", "quiz", "assignment"].includes(body.mode)
    ) {
      return NextResponse.json({ error: "Invalid tutor request payload." }, { status: 400 });
    }

    const recentMessages = body.messages.slice(-10);

    const anthropicResponse = await fetch(anthropicUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokensByMode[body.mode],
        stream: true,
        system: buildSystemPrompt(body),
        messages: recentMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });

    if (!anthropicResponse.ok || !anthropicResponse.body) {
      const errorText = await anthropicResponse.text();
      return NextResponse.json(
        {
          error: "Anthropic request failed",
          details: errorText,
        },
        { status: 500 },
      );
    }

    const reader = anthropicResponse.body.getReader();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            controller.enqueue(value);
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
    const message = error instanceof Error ? error.message : "Unknown tutor route error.";
    return NextResponse.json({ error: "Tutor route failed", details: message }, { status: 500 });
  }
}
