import { NextResponse } from "next/server";

import { buildGenerationPrompt } from "@/lib/assignment-agent";
import { AssignmentOutputMode, AssignmentProfile } from "@/lib/types";

export const runtime = "nodejs";

type AssignmentAgentRequestBody = {
  profile: AssignmentProfile;
  draftText?: string;
  mode: AssignmentOutputMode;
};

const anthropicUrl = "https://api.anthropic.com/v1/messages";
const allowedModes: AssignmentOutputMode[] = [
  "initial_post",
  "full_assignment",
  "outline",
  "peer_reply",
  "submission_comment",
  "quiz_study_reasoning",
  "rubric_cleanup",
  "apa_reference_cleanup",
  "compliance_check_only",
];

function isValidBody(body: unknown): body is AssignmentAgentRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as Record<string, unknown>;
  return (
    typeof candidate.profile === "object" &&
    candidate.profile !== null &&
    typeof candidate.draftText !== "object" &&
    typeof candidate.mode === "string" &&
    allowedModes.includes(candidate.mode as AssignmentOutputMode)
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const body = (await request.json()) as unknown;

    if (!isValidBody(body)) {
      return NextResponse.json({ error: "Invalid assignment agent payload." }, { status: 400 });
    }

    if (body.mode === "compliance_check_only") {
      return NextResponse.json({ output: "" });
    }

    if (
      body.mode === "peer_reply" &&
      body.profile.waitForPeerPosts &&
      !/classmate|peer post|student post/i.test(body.profile.prompt) &&
      !body.draftText?.trim()
    ) {
      return NextResponse.json(
        {
          error: "Peer posts are needed before a personalized peer reply can be generated.",
        },
        { status: 400 },
      );
    }

    const response = await fetch(anthropicUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1600,
        system:
          "You are Prof. Scholar inside Cloud Nexus Scholar. Produce final academic writing only. No outlines unless asked. No preambles. No markdown bolding. Keep the answer human, plain, and copy-ready.",
        messages: [
          {
            role: "user",
            content: buildGenerationPrompt({
              profile: body.profile,
              draftText: body.draftText,
              mode: body.mode,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Anthropic request failed",
          details: await response.text(),
        },
        { status: 500 },
      );
    }

    const payload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const output =
      payload.content
        ?.filter((item) => item.type === "text")
        .map((item) => item.text ?? "")
        .join("\n")
        .trim() ?? "";

    return NextResponse.json({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown assignment agent error.";
    return NextResponse.json(
      { error: "Assignment agent route failed", details: message },
      { status: 500 },
    );
  }
}
