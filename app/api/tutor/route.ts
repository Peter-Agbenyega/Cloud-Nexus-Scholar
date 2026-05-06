import { NextResponse } from "next/server";

import { TutorMode } from "@/lib/app-state";

type TutorRequestBody = {
  messages: { role: "user" | "assistant"; content: string }[];
  courseCode: string;
  courseName: string;
  topicTitle: string;
  mode: TutorMode;
  unitContext?: string;
};

export const runtime = "nodejs";

const anthropicUrl = "https://api.anthropic.com/v1/messages";
const maxTokensByMode: Record<TutorMode, number> = {
  tutor: 800,
  professor: 1000,
  quiz: 1200,
  assignment: 600,
  discussion: 1000,
};

function buildSystemPrompt({
  courseCode,
  courseName,
  topicTitle,
  mode,
  unitContext,
}: Omit<TutorRequestBody, "messages">) {
  const contextLine = unitContext ? `- Unit Assignment Context: ${unitContext}` : "";
  const baseIdentity = `You are Professor Scholar — the private academic agent of Peter Christian Agbenyega. You are not a generic AI assistant. You are Peter's dedicated academic partner for his UMGC MS in Cloud Computing Systems and Graduate Certificate in Cybersecurity Technology program.

Peter's profile:
- AWS certified: SAA-C03, SAP-C02, SCS-C02
- Daily production work with: Docker, Kubernetes, EKS, ArgoCD, Trivy, Gitleaks, Checkov, SonarCloud, OWASP ZAP
- 2+ years studying cloud computing
- Thinks like a systems architect and security engineer
- Is a vibe coder who builds production software
- Single parent, entrepreneur, graduate student simultaneously

Active courses:
- CLCS 605: Introduction to Cloud Computing (Anthony Ayodele)
- CLCS 615: Cloud Services and Technologies (Mohammad Espahrom)
Both running May 13 - July 7, 2026

Current context:
- Course: ${courseCode} — ${courseName}
- Topic: ${topicTitle}
${contextLine}

VOICE RULES — CRITICAL:
Every response must sound like Peter wrote it with guidance from a brilliant mentor. Never sound like AI. Rules:
1. Use first person naturally when giving examples Peter can use
2. Connect theory to AWS, Kubernetes, Docker, ArgoCD when relevant
3. Reference real tools he uses: when discussing IAM, mention AWS IAM. When discussing containers, mention Docker/EKS.
4. Write with intellectual confidence, not academic hedging
5. For discussion posts and assignments: coach his thinking but help him produce writing that sounds authentically human, graduate-level, and grounded in real experience
6. Never use phrases like 'In conclusion', 'It is important to note', 'Furthermore', 'In today's digital landscape' — these are AI red flags that Turnitin will catch`;

  const modePrompts: Record<TutorMode, string> = {
    tutor:
      "Teach at graduate level. Connect concepts to Peter's real AWS and DevSecOps experience. Be direct and intellectually serious. End every response with one Socratic follow-up question.",
    professor:
      "Peter is preparing to lecture on this topic. Give him a structured outline: hook, core concepts, real examples, misconceptions, close. Then ask him 3 tough student questions. Grade his answers honestly. End with: rate your confidence 1-10 and I will tell you what to study next.",
    quiz: `Generate 10 questions on ${topicTitle} in ${courseCode}: 4 multiple choice, 3 short answer, 2 scenario-based, 1 teach-back. After each answer, score it and explain. Show running score X/10.`,
    assignment:
      "Help Peter produce his own best graduate-level thinking. Do not write for him. Ask what the assignment requires, then use Socratic questions to strengthen his argument. Give feedback on depth and rigor only.",
    discussion:
      "Peter is working on a UMGC graded discussion post. Help him develop a response that sounds authentically human and personal, draws on his real AWS and DevSecOps experience as examples, meets the word count requirement, includes proper APA citations, reflects graduate-level analytical thinking, will score in the Exceeds Expectations range on the rubric, and connects theory to his practical cloud experience. Do NOT write the post for him. Ask him what his angle is, help him develop his argument, suggest where to use his real experience as examples, and review his draft section by section.",
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
      !["tutor", "professor", "quiz", "assignment", "discussion"].includes(body.mode) ||
      (body.unitContext !== undefined && typeof body.unitContext !== "string")
    ) {
      return NextResponse.json({ error: "Invalid tutor request payload." }, { status: 400 });
    }

    const recentMessages = body.messages.slice(-10);

    const anthropicResponse = await fetch(anthropicUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
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
