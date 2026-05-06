"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ACTIVE_SYLLABUS_COURSES,
  CLCS605_COURSE,
  CLCS615_COURSE,
  SyllabusCourse,
} from "@/lib/syllabus-data";

type ResourceTab = "clcs605" | "clcs615";

const resourceCards = [
  {
    title: "NIST Cloud Definition",
    body: `"A model for enabling ubiquitous, convenient, on-demand network access to a shared pool of configurable computing resources (networks, servers, storage, applications, and services) that can be rapidly provisioned and released with minimal management effort or service provider interaction." — NIST SP 800-145`,
    bullets: [
      "On-demand self-service",
      "Broad network access",
      "Resource pooling",
      "Rapid elasticity",
      "Measured service",
    ],
  },
  {
    title: "Service Models Cheat Sheet",
    body: "Map the model to the operating boundary first, then to Peter's AWS examples.",
    bullets: [
      "IaaS: Hardware virtualized — AWS EC2, Azure VMs, GCP Compute",
      "PaaS: Platform managed — AWS Elastic Beanstalk, Azure App Service",
      "SaaS: Full application — Salesforce, Gmail, Office 365",
      "Key exam angle: Map each to Peter's real AWS experience",
    ],
  },
  {
    title: "Deployment Models",
    body: "Deployment models are governance and control choices, not just hosting labels.",
    bullets: [
      "Public: Multi-tenant, provider-owned — AWS, Azure, GCP",
      "Private: Single-tenant, org-controlled — on-prem or hosted",
      "Hybrid: Mix of public + private — most enterprise reality",
      "Community: Shared among specific organizations",
      "Multi-cloud: Multiple providers — Peter's real-world default",
    ],
  },
  {
    title: "APA Citation Templates",
    body: "Use the structure first, then swap in the exact source details.",
    bullets: [
      "Journal: Author, A. A. (Year). Title. Journal, Vol(Issue), pages. DOI",
      "Book: Author, A. A. (Year). Title (Ed.). Publisher.",
      "Website: Author. (Year, Month Day). Title. Site. URL",
      "AI Tool: OpenAI. (Year). ChatGPT [Large language model]. URL",
    ],
  },
  {
    title: "Discussion Post Formula",
    body: "Opening: State your position clearly in 1-2 sentences",
    bullets: [
      "Experience → Theory → Analysis",
      "Reference your real cloud experience",
      "Connect to the theoretical concept",
      "Analyze the implications",
      "Closing: Connect to broader professional context",
      "Peer Response: 'Builds on' not 'agrees with' — add new angle",
    ],
  },
  {
    title: "Graduate Grading Reality",
    body: "The target is not just passing. The target is staying comfortably above the graduate floor.",
    bullets: [
      "A: 900-1000 pts (90-100%) — Target",
      "B: 800-899 pts (80-89%) — Minimum safe zone",
      "C: 700-799 pts — Academic Probation risk",
      "Below C: Academic Probation — must retake course",
    ],
  },
] as const;

const aiRedFlags = [
  "In conclusion",
  "It is important to note",
  "Furthermore",
  "In today's digital landscape",
  "Leveraging",
  "Utilize",
  "It is worth noting",
  "As we can see",
  "In summary",
  "This essay will",
  "The purpose of this paper",
];

const knowledgeAnchors = [
  {
    title: "Your AWS IAM experience → CLCS 605 Unit 2 (Cloud Security)",
    href: "/courses/clcs-605-introduction-to-cloud-computing/unit/2",
  },
  {
    title: "Your EKS clusters → CLCS 605 Unit 6 (Cloud Development)",
    href: "/courses/clcs-605-introduction-to-cloud-computing/unit/6",
  },
  {
    title: "Your ArgoCD pipelines → CLCS 605 Unit 7 (Cloud Automation)",
    href: "/courses/clcs-605-introduction-to-cloud-computing/unit/7",
  },
  {
    title: "Your Trivy/Gitleaks/Checkov → CLCS 615 Unit 4 (Security Architecture)",
    href: "/courses/clcs-615-cloud-services-and-technologies/unit/4",
  },
  {
    title: "Your Docker knowledge → Unit 1 Virtualization topic",
    href: "/courses/clcs-605-introduction-to-cloud-computing/unit/1",
  },
  {
    title: "Your SonarCloud usage → Cloud DevOps patterns",
    href: "/courses/clcs-605-introduction-to-cloud-computing/unit/6",
  },
] as const;

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<ResourceTab>("clcs605");
  const activeCourse = activeTab === "clcs605" ? CLCS605_COURSE : CLCS615_COURSE;

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Resources</div>
        <h1 className="mt-3 text-4xl font-semibold text-text">Resource Command Center</h1>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted">
          Everything you need for CLCS 605 and CLCS 615. No external searching required.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {resourceCards.map((card) => (
          <article key={card.title} className="rounded-card border border-border/70 bg-panelAlt/60 p-5">
            <h2 className="text-xl font-semibold text-text">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{card.body}</p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {card.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("clcs605")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeTab === "clcs605"
                ? "border-accent bg-accent/10 text-text"
                : "border-border/70 bg-panelAlt/50 text-muted hover:border-accent/35 hover:text-text"
            }`}
          >
            CLCS 605
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("clcs615")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeTab === "clcs615"
                ? "border-accent bg-accent/10 text-text"
                : "border-border/70 bg-panelAlt/50 text-muted hover:border-accent/35 hover:text-text"
            }`}
          >
            CLCS 615
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {activeCourse.units.map((unit) => (
            <article key={unit.unit} className="rounded-card border border-border/70 bg-panelAlt/55 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-accent">Unit {unit.unit}</div>
                  <h2 className="mt-2 text-xl font-semibold text-text">{unit.topic}</h2>
                </div>
                <Link
                  href={`/courses/${activeCourse.slug}/unit/${unit.unit}`}
                  className="rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90"
                >
                  Study this unit
                </Link>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">Key concepts</div>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {unit.subtopics.map((subtopic) => (
                      <li key={subtopic}>{subtopic}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted">Assignments this unit</div>
                  <div className="mt-3 space-y-2">
                    {unit.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="rounded-2xl border border-border/70 bg-panel/70 px-4 py-3 text-sm text-text"
                      >
                        {assignment.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <article className="rounded-card border border-border/70 bg-panel/80 p-6">
          <h2 className="text-2xl font-semibold text-text">Writing Resources</h2>
          <div className="mt-5 space-y-5 text-sm leading-7 text-muted">
            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-accent">APA Format Quick Guide</div>
              <p className="mt-3">
                Use author, year, title, and retrieval details consistently. If you quote or cite a specific cloud framework, include the publication year and direct source. When you paraphrase NIST or AWS documentation, cite the source anyway.
              </p>
            </div>
            <div className="rounded-card border border-border/70 bg-panelAlt/55 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-accent">Discussion Post Rubric</div>
              <ul className="mt-3 space-y-2">
                <li>Collaborative learning: 20</li>
                <li>Evidence of skill development: 20</li>
                <li>Engagement and respect: 20</li>
                <li>Initiative: 5</li>
                <li>Communication and writing: 10</li>
              </ul>
            </div>
          </div>
        </article>

        <article className="rounded-card border border-border/70 bg-panel/80 p-6">
          <h2 className="text-2xl font-semibold text-text">Common AI Red-Flag Phrases to Avoid</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {aiRedFlags.map((phrase) => (
              <span
                key={phrase}
                className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-100"
              >
                {phrase}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <h2 className="text-2xl font-semibold text-text">Peter&apos;s Knowledge Anchors</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {knowledgeAnchors.map((anchor) => (
            <Link
              key={anchor.title}
              href={anchor.href}
              className="rounded-card border border-border/70 bg-panelAlt/55 p-5 text-sm leading-7 text-muted transition hover:border-accent/35 hover:text-text"
            >
              {anchor.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <h2 className="text-2xl font-semibold text-text">Core Resource Stack</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(ACTIVE_SYLLABUS_COURSES as SyllabusCourse[])
            .flatMap((course) => course.keyResources ?? [])
            .map((resource) => (
            <div key={resource} className="rounded-2xl border border-border/70 bg-panelAlt/55 px-4 py-3 text-sm text-muted">
              {resource}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
