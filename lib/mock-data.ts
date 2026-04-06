import { Course } from "@/lib/types";

export const courses: Course[] = [
  {
    slug: "cloud-foundations",
    title: "Cloud Foundations",
    code: "CNS-101",
    level: "Beginner",
    duration: "4 weeks",
    description:
      "Build a durable mental model for cloud infrastructure, service boundaries, and platform tradeoffs before touching production systems.",
    outcomes: [
      "Understand core cloud service models and deployment patterns.",
      "Map workloads to storage, compute, and networking primitives.",
      "Explain cost, resilience, and security tradeoffs clearly.",
    ],
    topics: [
      {
        slug: "shared-responsibility",
        title: "Shared Responsibility Model",
        description:
          "Separate provider responsibilities from application and team obligations.",
        lessons: [
          {
            slug: "lesson",
            title: "Provider vs Customer Boundaries",
            duration: "18 min",
            objective:
              "Identify which operational and security controls remain with your team.",
            summary:
              "This lesson frames cloud as a boundary negotiation. The provider abstracts physical infrastructure, but workload identity, configuration quality, and application risk remain yours.",
            bullets: [
              "Infrastructure abstraction does not remove accountability for workload design.",
              "Managed services shift toil, not ownership of data classification or access policy.",
              "Teams need written responsibility maps before scaling environments.",
            ],
          },
        ],
      },
      {
        slug: "core-primitives",
        title: "Core Cloud Primitives",
        description:
          "Review the baseline vocabulary for storage, networking, compute, and IAM.",
        lessons: [
          {
            slug: "lesson",
            title: "The Four Primitives",
            duration: "22 min",
            objective:
              "Connect compute, storage, networking, and identity into one operating model.",
            summary:
              "The useful abstraction is not a service catalog, it is the relationship between the primitives. Every production system is some composition of identity, network exposure, persistent state, and execution.",
            bullets: [
              "Compute is worthless without identity and network boundaries.",
              "Storage decisions define durability, cost curve, and latency envelope.",
              "Well-scoped IAM is often the difference between a recoverable error and an incident.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "platform-architecture",
    title: "Platform Architecture",
    code: "CNS-201",
    level: "Intermediate",
    duration: "6 weeks",
    description:
      "Design platform capabilities that support multiple products without collapsing into over-engineered internal tooling.",
    outcomes: [
      "Model platform boundaries around product needs.",
      "Design scalable internal interfaces for teams.",
      "Reduce coordination drag with clearer abstractions.",
    ],
    topics: [
      {
        slug: "service-boundaries",
        title: "Service Boundaries",
        description:
          "Define seams between services based on ownership, failure domains, and rate of change.",
        lessons: [
          {
            slug: "lesson",
            title: "Boundary Design Under Load",
            duration: "26 min",
            objective:
              "Choose boundary lines that survive growth and independent team movement.",
            summary:
              "Healthy boundaries reduce coupling in both code and operations. The goal is not tiny services, it is predictable ownership and understandable failure isolation.",
            bullets: [
              "Separate by volatility and ownership, not by noun extraction.",
              "Every network call creates operational drag and latency tax.",
              "Boundaries should simplify incident response instead of obscuring it.",
            ],
          },
        ],
      },
      {
        slug: "delivery-topology",
        title: "Delivery Topology",
        description:
          "Align CI/CD, environments, and deployment patterns with team topology.",
        lessons: [
          {
            slug: "lesson",
            title: "From Merge to Release",
            duration: "24 min",
            objective:
              "Trace a change from commit through validation, promotion, and production release.",
            summary:
              "Delivery topology is the architecture of confidence. Reliable systems are shipped by pipelines that prove enough, early enough, and with rollback paths that the team can actually operate.",
            bullets: [
              "Promotion rules should reflect risk, not tradition.",
              "Preview and staging environments solve different problems and should not be conflated.",
              "Rollback speed matters more than pipeline theater.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "security-operations",
    title: "Security Operations",
    code: "CNS-301",
    level: "Advanced",
    duration: "5 weeks",
    description:
      "Operationalize cloud security through observable controls, incident readiness, and practical escalation design.",
    outcomes: [
      "Harden identity and runtime access patterns.",
      "Create actionable alerting and response flows.",
      "Tie preventive controls to operational evidence.",
    ],
    topics: [
      {
        slug: "identity-guardrails",
        title: "Identity Guardrails",
        description:
          "Constrain human and machine access without turning basic work into ceremony.",
        lessons: [
          {
            slug: "lesson",
            title: "Least Privilege That Ships",
            duration: "20 min",
            objective:
              "Apply least privilege principles in a way teams can keep using.",
            summary:
              "Good security guardrails reduce decision surface area. The team should not need heroics to stay inside policy; the paved road should be the fast road.",
            bullets: [
              "Role design should mirror job reality, not spreadsheet categories.",
              "Temporary elevation needs expiration, auditability, and default denial.",
              "Machine identity sprawl is usually a platform design problem before it is a policy problem.",
            ],
          },
        ],
      },
      {
        slug: "incident-workflows",
        title: "Incident Workflows",
        description:
          "Move from passive monitoring to concrete response paths and evidence capture.",
        lessons: [
          {
            slug: "lesson",
            title: "Operating the First Hour",
            duration: "28 min",
            objective:
              "Stabilize systems, preserve evidence, and narrow blast radius quickly.",
            summary:
              "The first hour of an incident is about disciplined reduction of uncertainty. Teams need response structure, not just dashboards, if they want to make good decisions under stress.",
            bullets: [
              "Triage should prioritize containment and clarity over perfect diagnosis.",
              "Runbooks fail when they are too verbose to use live.",
              "Post-incident learning should change systems, not just documentation.",
            ],
          },
        ],
      },
    ],
  },
];

export function getCourses(): Course[] {
  return courses;
}

export function getCourseBySlug(courseSlug: string): Course | undefined {
  return courses.find((course) => course.slug === courseSlug);
}

export function getTopicBySlug(courseSlug: string, topicSlug: string) {
  return getCourseBySlug(courseSlug)?.topics.find((topic) => topic.slug === topicSlug);
}
