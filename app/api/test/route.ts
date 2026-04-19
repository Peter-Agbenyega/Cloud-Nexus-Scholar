import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey && apiKey.startsWith("sk-ant")) {
    return NextResponse.json({ ok: true, message: "Professor Scholar is online" });
  }

  return NextResponse.json({ ok: false, error: "API key not configured" });
}
