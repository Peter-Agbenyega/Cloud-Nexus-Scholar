"use client";

import { useMemo, useState } from "react";

import { TutorPanel } from "@/components/tutor-panel";

type Scenario = {
  title: string;
  description: string;
};

const starterScenarios: Scenario[] = [
  {
    title: "IAM Privilege Escalation",
    description:
      "An attacker has compromised a low-privilege AWS IAM role. What happens next and how do you stop it?",
  },
  {
    title: "Container Escape",
    description:
      "A vulnerability in a containerized app allows process breakout. Walk through detection and response.",
  },
  {
    title: "Kubernetes RBAC Misconfiguration",
    description:
      "A misconfigured ClusterRoleBinding exposes cluster-admin to a service account. Trace the blast radius.",
  },
  {
    title: "Supply Chain Attack via Compromised Docker Image",
    description:
      "A base image in your CI pipeline has been tampered with. How do you detect and remediate?",
  },
  {
    title: "Cloud Storage Exfiltration",
    description:
      "An S3 bucket with misconfigured public access is leaking sensitive data. Build your incident response playbook.",
  },
];

export default function SandboxPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(starterScenarios[0]);
  const [customScenarioInput, setCustomScenarioInput] = useState("");

  const renderedScenario = useMemo(() => selectedScenario, [selectedScenario]);

  function openCustomScenario() {
    const trimmed = customScenarioInput.trim();

    if (!trimmed) {
      return;
    }

    setSelectedScenario({
      title: "Custom Scenario",
      description: trimmed,
    });
    setCustomScenarioInput("");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-accent">Sandbox</div>
        <h1 className="mt-3 text-4xl font-semibold text-text">
          Cyber Sandbox — Defensive Scenario Training
        </h1>
        <p className="mt-2 text-lg text-muted">Think like an attacker. Defend like an architect.</p>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted">
          These scenario threads are built for how Peter actually works: AWS-heavy, containerized,
          Kubernetes-aware, and security-minded. The tutor runs in professor mode here so every
          answer gets pushed toward teachable, defensible reasoning.
        </p>
      </section>

      <section className="rounded-card border border-border/70 bg-panelAlt/70 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">Scenario selector</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {starterScenarios.map((scenario) => {
            const isActive = renderedScenario.description === scenario.description;

            return (
              <button
                key={scenario.title}
                type="button"
                onClick={() => setSelectedScenario(scenario)}
                className={`rounded-card border p-5 text-left transition ${
                  isActive
                    ? "border-accent bg-accent/10"
                    : "border-border/70 bg-panel/70 hover:border-accent/35"
                }`}
              >
                <div className="text-lg font-semibold text-text">{scenario.title}</div>
                <div className="mt-3 text-sm leading-7 text-muted">{scenario.description}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-card border border-border/70 bg-panel/70 p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">Custom Scenario</div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <textarea
              value={customScenarioInput}
              onChange={(event) => setCustomScenarioInput(event.target.value)}
              rows={4}
              placeholder="Describe your own cloud or cyber incident scenario..."
              className="min-h-[120px] flex-1 rounded-3xl border border-border/70 bg-panelAlt/60 px-4 py-3 text-sm text-text outline-none transition focus:border-accent"
            />
            <button
              type="button"
              onClick={openCustomScenario}
              className="rounded-full border border-accent bg-accent px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 md:self-start"
            >
              Open Custom Scenario
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-card border border-border/70 bg-panel/80 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-accent">Scenario detail</div>
        <h2 className="mt-3 text-2xl font-semibold text-text">{renderedScenario.title}</h2>
        <p className="mt-4 text-sm leading-7 text-muted">{renderedScenario.description}</p>
      </section>

      <TutorPanel
        courseCode="SANDBOX"
        courseName="Cyber Scenario Training"
        topicTitle={renderedScenario.title}
        initialMode="professor"
      />
    </div>
  );
}
