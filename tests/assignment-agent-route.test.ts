import { POST } from "@/app/api/assignment-agent/route";
import { AssignmentProfile } from "@/lib/types";

function buildProfile(overrides: Partial<AssignmentProfile> = {}): AssignmentProfile {
  return {
    course: "CLCS 605",
    unit: "Unit 1",
    type: "discussion",
    title: "Cloud Discussion",
    prompt: "Write a 300-400 word discussion response with one APA citation.",
    rubric: "",
    initialPostWordCount: "300-400 words",
    peerRepliesRequired: 0,
    citationRequired: true,
    apaReferenceRequired: true,
    requiredSections: [],
    requiredDeliverables: [],
    rubricCriteria: [],
    practicalRequired: false,
    practicalEvidenceItems: [],
    waitForPeerPosts: false,
    screenshotsOrFilesRequired: false,
    sourceHints: [],
    ...overrides,
  };
}

describe("assignment-agent API route", () => {
  const originalApiKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.ANTHROPIC_API_KEY = originalApiKey;
  });

  it("accepts a valid generation request and returns a clean draft", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: "text", text: "  This is a clean academic draft.  " }],
        }),
        { status: 200 },
      ),
    );

    const request = new Request("http://localhost/api/assignment-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: buildProfile(),
        mode: "initial_post",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { output: string };

    expect(response.status).toBe(200);
    expect(payload.output).toBe("This is a clean academic draft.");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns an error for an invalid request payload", async () => {
    const request = new Request("http://localhost/api/assignment-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: null,
        mode: "not-real",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid assignment agent payload.");
  });

  it("does not call the external API for compliance-check-only mode", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const request = new Request("http://localhost/api/assignment-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: buildProfile(),
        mode: "compliance_check_only",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { output: string };

    expect(response.status).toBe(200);
    expect(payload.output).toBe("");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
