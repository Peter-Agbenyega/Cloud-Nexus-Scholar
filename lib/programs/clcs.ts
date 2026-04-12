import { Program, UMGCCourse, CourseTopic, Concept } from "@/lib/types";

function buildConcept(input: Omit<Concept, "relatedConcepts" | "crossCourseLinks"> & {
  relatedConcepts?: string[];
  crossCourseLinks?: Concept["crossCourseLinks"];
}): Concept {
  return {
    ...input,
    relatedConcepts: input.relatedConcepts ?? [],
    crossCourseLinks: input.crossCourseLinks ?? [],
  };
}

function buildTopic(input: Omit<CourseTopic, "sourceType"> & {
  sourceType?: CourseTopic["sourceType"];
}): CourseTopic {
  const sourceType = input.sourceType ?? "learning-map";

  return {
    ...input,
    sourceType,
    umgcWeek: sourceType === "syllabus-derived" ? input.umgcWeek : undefined,
  };
}

function buildCourse(input: Omit<UMGCCourse, "sourceType"> & {
  sourceType?: UMGCCourse["sourceType"];
}): UMGCCourse {
  const sourceType =
    input.sourceType ??
    (input.code.startsWith("CLCS ELEC")
      ? "app-learning-map"
      : "official-program-structure");

  return {
    ...input,
    sourceType,
  };
}

const clcs605 = buildCourse({
  slug: "clcs-605-introduction-to-cloud-computing",
  code: "CLCS 605",
  title: "Introduction to Cloud Computing",
  credits: 3,
  program: "ms-cloud-computing-systems",
  track: "clcs-core",
  prereqs: [],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Establishes the operating vocabulary for cloud service models, responsibility boundaries, and the business case for cloud adoption.",
  learningOutcomes: [
    "Differentiate cloud service and deployment models in business and technical terms.",
    "Explain shared responsibility boundaries across provider and customer teams.",
    "Evaluate cloud adoption tradeoffs around risk, agility, and governance.",
  ],
  cyberOverlap: [
    "Connects cloud shared responsibility to cybersecurity ownership and control accountability.",
    "Introduces IAM and data protection concepts that later recur in CTCH security courses.",
  ],
  topics: [
    buildTopic({
      slug: "cloud-service-models",
      title: "Cloud Service Models and Deployment Choices",
      description:
        "Frames IaaS, PaaS, SaaS, and public-private-hybrid deployment choices as operating decisions rather than marketing labels.",
      umgcWeek: "Week 1",
      assessmentRelevance:
        "Supports course discussions, architecture comparisons, and early program roadmap decisions.",
      objective:
        "Choose the right cloud operating model for a workload and explain the tradeoffs clearly.",
      summary:
        "The durable skill in this opening course is not memorizing provider terminology. It is recognizing which parts of the stack the learner owns, which parts are abstracted away, and how those decisions affect scale, security, and change velocity.",
      sections: [
        {
          heading: "Compare service models by ownership boundary",
          content: [
            "IaaS keeps more operating responsibility with the learner, which creates flexibility but also demands stronger control over patching, network design, and workload hardening.",
            "PaaS and SaaS move responsibility upward into managed layers. That reduces undifferentiated operations work, but it also narrows how much of the platform can be tuned directly.",
          ],
        },
        {
          heading: "Deployment models shape risk and governance",
          content: [
            "Public, private, and hybrid cloud choices are usually made because of data sensitivity, integration constraints, cost posture, or regulatory boundaries rather than abstract ideology.",
            "UMGC-style evaluation work will expect these choices to be justified using business, architecture, and risk language together.",
          ],
        },
      ],
      bullets: [
        "Service models are ownership choices before they are product choices.",
        "Deployment model selection affects governance, latency, and integration complexity.",
        "A strong answer compares tradeoffs instead of claiming a single universal best model.",
      ],
      concepts: [
        buildConcept({
          id: "cloud-service-models",
          name: "Cloud Service Models",
          explanations: {
            eli10: "Cloud service models are different ways of deciding how much of the computer setup you run yourself and how much the provider runs for you.",
            intermediate:
              "Cloud service models define which layers of the technology stack stay under customer control and which layers are managed by the cloud provider.",
            advanced:
              "Cloud service models are operating abstractions that reallocate accountability across infrastructure, platform, and application layers with direct implications for governance, automation, and risk.",
          },
          whatIsIt: "A framework for distinguishing IaaS, PaaS, and SaaS based on who manages each system layer.",
          whyItMatters:
            "It determines what the learner must secure, configure, monitor, and budget for in a production environment.",
          howItWorks:
            "The more the provider manages, the more the customer trades low-level control for speed and operational leverage.",
          whereUsed: ["Platform selection", "Migration planning", "Cloud operating model design"],
          whatCanGoWrong: [
            "Choosing a model that hides required controls",
            "Assuming managed means fully secure",
            "Underestimating integration or customization limits",
          ],
          howSecured: [
            "Map controls to the actual service boundary",
            "Document retained customer responsibilities",
            "Review identity and data-protection requirements for each model",
          ],
          howUMGCTests: [
            "Comparison essays",
            "Architecture justification prompts",
            "Case-study analysis questions",
          ],
          diagramSpec:
            "Three-column stack diagram comparing customer-owned and provider-owned layers for IaaS, PaaS, and SaaS.",
          relatedConcepts: ["shared-responsibility-model", "cloud-adoption-drivers"],
        }),
        buildConcept({
          id: "cloud-adoption-drivers",
          name: "Cloud Adoption Drivers",
          explanations: {
            eli10: "Teams move to the cloud because they want faster building, easier scaling, or less hardware to manage.",
            intermediate:
              "Cloud adoption drivers are the business and technical reasons an organization chooses cloud delivery over traditional infrastructure.",
            advanced:
              "Cloud adoption drivers are strategic pressures that justify cloud migration through agility, resilience, elasticity, financial flexibility, and operating model change.",
          },
          whatIsIt:
            "A set of motives such as scalability, cost flexibility, resilience, and faster delivery that influence cloud strategy.",
          whyItMatters:
            "UMGC architecture analysis is stronger when cloud decisions are tied to organizational outcomes rather than only technical preference.",
          howItWorks:
            "Drivers are translated into platform requirements, migration priorities, and architecture constraints.",
          whereUsed: ["Business case development", "Migration proposals", "Executive architecture communication"],
          whatCanGoWrong: [
            "Treating cloud as automatically cheaper",
            "Ignoring governance changes required to realize speed",
            "Migrating workloads with no clear outcome target",
          ],
          howSecured: [
            "Add governance guardrails early",
            "Define measurable adoption outcomes",
            "Evaluate sensitive workloads before migration",
          ],
          howUMGCTests: [
            "Strategic recommendation papers",
            "Discussion board prompts",
            "Cloud adoption scenario critiques",
          ],
          relatedConcepts: ["cloud-service-models", "shared-responsibility-model"],
        }),
      ],
    }),
    buildTopic({
      slug: "shared-responsibility-and-iam",
      title: "Shared Responsibility and Identity Boundaries",
      description:
        "Clarifies which security and operational controls stay with the learner after moving into provider-managed infrastructure.",
      umgcWeek: "Week 3",
      assessmentRelevance:
        "Used in security responsibility mapping, control analysis, and future cyber bridge behavior.",
      objective:
        "Map provider responsibilities, customer responsibilities, and identity control points without ambiguity.",
      summary:
        "This topic moves from general cloud terminology into control ownership. It is the point where cloud architecture becomes inseparable from security operations because identity, configuration, and data handling remain customer obligations even in highly managed environments.",
      sections: [
        {
          heading: "Responsibility shifts but never disappears",
          content: [
            "Moving a workload to the cloud changes who operates facilities, hardware, and managed runtimes. It does not remove accountability for data classification, access governance, or secure workload design.",
            "The learner needs to reason about control ownership at the service boundary, not at the marketing boundary.",
          ],
        },
        {
          heading: "Identity is part of the architecture",
          content: [
            "IAM is not a side policy. It is one of the core cloud primitives because it determines who can act, what systems can connect, and how blast radius is controlled.",
            "This becomes a direct bridge into CTCH cybersecurity work focused on access defense and secure systems operation.",
          ],
        },
      ],
      bullets: [
        "Managed infrastructure does not eliminate customer security obligations.",
        "IAM decisions are architectural because they control both normal operations and incident blast radius.",
        "Shared responsibility should be mapped in concrete control language, not slogans.",
      ],
      concepts: [
        buildConcept({
          id: "shared-responsibility-model",
          name: "Shared Responsibility Model",
          explanations: {
            eli10: "The cloud provider protects some parts of the system, but your team still has to protect the parts you control.",
            intermediate:
              "The shared responsibility model divides operational and security duties between the provider and the customer based on the service consumed.",
            advanced:
              "The shared responsibility model is a control-allocation framework in which provider-managed layers reduce infrastructure toil while preserving customer accountability for identity, data, configuration, and workload risk.",
          },
          whatIsIt:
            "A way to decide which controls are owned by the cloud provider and which remain the customer’s job.",
          whyItMatters:
            "Most cloud failures come from misunderstood control ownership rather than provider hardware failure.",
          howItWorks:
            "Responsibility moves by service model: the more the provider manages, the narrower but still critical the customer control surface becomes.",
          whereUsed: ["Security governance", "Control mapping", "Audit readiness", "Architecture reviews"],
          whatCanGoWrong: [
            "Assuming provider defaults cover customer data handling",
            "Leaving identity ownership undefined",
            "Failing to monitor managed-service configuration risk",
          ],
          howSecured: [
            "Document control ownership",
            "Tie IAM and logging to each workload",
            "Review service-specific security obligations before deployment",
          ],
          howUMGCTests: [
            "Responsibility mapping assignments",
            "Security comparison essays",
            "Scenario-based control analysis",
          ],
          relatedConcepts: ["identity-and-access-management", "cloud-service-models"],
          crossCourseLinks: [
            {
              courseCode: "CTCH 605",
              topicSlug: "security-governance-and-ownership",
              conceptId: "security-control-ownership",
              rationale:
                "Both courses require the learner to distinguish who owns preventive, detective, and corrective controls.",
            },
          ],
        }),
        buildConcept({
          id: "identity-and-access-management",
          name: "Identity and Access Management",
          explanations: {
            eli10: "IAM is the rulebook for who can sign in and what they are allowed to do.",
            intermediate:
              "IAM manages authentication, authorization, role design, and permission boundaries for humans and systems.",
            advanced:
              "IAM is the policy and enforcement layer that governs principal identity, privilege scope, trust relationships, and access governance across cloud workloads.",
          },
          whatIsIt:
            "The set of mechanisms that control user, service, and system access to cloud resources.",
          whyItMatters:
            "Identity is often the shortest path to privilege escalation or data exposure if poorly designed.",
          howItWorks:
            "Principals authenticate, policies evaluate permissions, and roles or groups determine what actions are allowed in each context.",
          whereUsed: ["Cloud administration", "Application access control", "DevOps pipelines", "Incident response"],
          whatCanGoWrong: [
            "Overprivileged roles",
            "Long-lived credentials",
            "Weak separation of duties",
          ],
          howSecured: [
            "Least-privilege roles",
            "Federated identity",
            "Multi-factor authentication",
            "Short-lived credentials",
          ],
          howUMGCTests: [
            "Role design scenarios",
            "Security architecture prompts",
            "Cross-course concept comparisons",
          ],
          relatedConcepts: ["shared-responsibility-model", "network-segmentation"],
          crossCourseLinks: [
            {
              courseCode: "CTCH 625",
              topicSlug: "access-defense-for-systems-and-networks",
              conceptId: "defensive-access-control",
              rationale:
                "IAM in cloud environments overlaps directly with access defense for systems and networks.",
            },
          ],
        }),
      ],
    }),
  ],
});

const clcs615 = buildCourse({
  slug: "clcs-615-cloud-services-and-technologies",
  code: "CLCS 615",
  title: "Cloud Services and Technologies",
  credits: 3,
  program: "ms-cloud-computing-systems",
  track: "clcs-core",
  prereqs: ["CLCS 605"],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Surveys core cloud platform capabilities including compute, storage, networking, automation, and managed service patterns.",
  learningOutcomes: [
    "Compare foundational cloud services and their primary workload use cases.",
    "Evaluate managed service choices using scalability, resilience, and cost criteria.",
    "Explain how automation and orchestration improve repeatable cloud delivery.",
  ],
  cyberOverlap: [
    "Reinforces IAM and network service concepts that connect to cyber defense controls.",
    "Introduces automation choices that later matter for secure configuration and response.",
  ],
  topics: [
    buildTopic({
      slug: "compute-storage-platform-services",
      title: "Compute, Storage, and Managed Platform Services",
      description:
        "Maps execution models and storage patterns to the operational needs of modern cloud workloads.",
      umgcWeek: "Week 2",
      assessmentRelevance:
        "Feeds platform comparison assignments and workload-to-service mapping exercises.",
      objective:
        "Choose service combinations that fit workload behavior, resilience targets, and operational overhead.",
      summary:
        "A cloud system is a composition of execution environments, data stores, and service integrations. This topic teaches the learner to choose combinations based on workload characteristics rather than by following provider menus blindly.",
      sections: [
        {
          heading: "Execution models change operating cost",
          content: [
            "Virtual machines, containers, and serverless functions all execute code, but they differ in control surface, elasticity, runtime constraints, and maintenance expectations.",
            "UMGC work in this course should show that the learner can explain those tradeoffs in plain technical language.",
          ],
        },
        {
          heading: "Storage strategy defines system behavior",
          content: [
            "Object, block, and file storage solve different persistence problems. The decision affects durability, cost, performance, and how applications are structured.",
            "Managed databases extend that logic further by shifting some operational work to the provider while still requiring correct schema, access, and backup strategy.",
          ],
        },
      ],
      bullets: [
        "Compute choices shape elasticity, operational burden, and observability.",
        "Storage choices define durability, latency, and application coupling.",
        "Managed services reduce toil but still require design accountability.",
      ],
      concepts: [
        buildConcept({
          id: "cloud-compute-patterns",
          name: "Cloud Compute Patterns",
          explanations: {
            eli10: "Cloud compute patterns are the different ways cloud systems run your code, like big servers, containers, or small event-based functions.",
            intermediate:
              "Cloud compute patterns describe the execution environments used for workloads, including VMs, containers, and serverless functions.",
            advanced:
              "Cloud compute patterns are workload execution strategies that trade control, elasticity, cold-start behavior, operational overhead, and platform abstraction differently across runtime models.",
          },
          whatIsIt:
            "A comparison framework for selecting between major cloud execution options.",
          whyItMatters:
            "The execution model shapes deployment speed, scaling behavior, cost, and incident surface.",
          howItWorks:
            "Each compute pattern abstracts a different amount of infrastructure management while imposing different runtime assumptions.",
          whereUsed: ["Application hosting", "Batch processing", "Event-driven design", "DevOps delivery"],
          whatCanGoWrong: [
            "Choosing serverless for long-running jobs without mitigation",
            "Running containers without image or secret controls",
            "Overbuilding on VMs when managed runtimes would fit better",
          ],
          howSecured: [
            "Harden runtime identities",
            "Patch base images and host layers",
            "Scope permissions to execution context",
          ],
          howUMGCTests: [
            "Service comparison reports",
            "Workload fit analyses",
            "Cloud technology recommendation prompts",
          ],
          relatedConcepts: ["managed-storage-strategy", "infrastructure-automation"],
        }),
        buildConcept({
          id: "managed-storage-strategy",
          name: "Managed Storage Strategy",
          explanations: {
            eli10: "Managed storage strategy means choosing the right kind of cloud storage for the kind of data you have.",
            intermediate:
              "Managed storage strategy aligns object, block, file, and database services to workload durability and access needs.",
            advanced:
              "Managed storage strategy is the deliberate selection of persistence services based on consistency, throughput, retention, failure recovery, and cost behavior.",
          },
          whatIsIt:
            "A decision model for matching cloud storage options to system requirements.",
          whyItMatters:
            "Bad persistence choices create unnecessary latency, recovery pain, and cost drift.",
          howItWorks:
            "Architects evaluate access patterns, data criticality, retention rules, and performance needs before selecting the storage layer.",
          whereUsed: ["Application design", "Data lifecycle planning", "Backup architecture"],
          whatCanGoWrong: [
            "Using the wrong storage type for access patterns",
            "Ignoring backup and restore objectives",
            "Exposing data through weak access configuration",
          ],
          howSecured: [
            "Encrypt data at rest and in transit",
            "Restrict access paths",
            "Test backup recovery workflows",
          ],
          howUMGCTests: [
            "Case-study recommendations",
            "Platform architecture comparisons",
            "Resilience planning questions",
          ],
          relatedConcepts: ["cloud-compute-patterns", "shared-responsibility-model"],
        }),
      ],
    }),
    buildTopic({
      slug: "automation-and-service-integration",
      title: "Automation, APIs, and Service Integration",
      description:
        "Introduces automation patterns that make cloud environments repeatable, inspectable, and scalable.",
      umgcWeek: "Week 5",
      assessmentRelevance:
        "Prepares for later design, networking, and capstone delivery work built around repeatable infrastructure.",
      objective:
        "Explain how automation improves consistency, recovery speed, and governance in cloud operations.",
      summary:
        "As the program matures, manual configuration becomes the main source of drift and inconsistency. This topic positions automation and service integration as the foundation for reliable cloud delivery and later secure architecture work.",
      sections: [
        {
          heading: "Automation reduces configuration drift",
          content: [
            "Infrastructure templates, deployment pipelines, and API-driven provisioning create repeatable environments that are easier to audit and recover.",
            "This does not remove the need for architecture review. It raises the importance of design discipline because repeated mistakes scale just as efficiently as repeated best practices.",
          ],
        },
        {
          heading: "Integration design must include security boundaries",
          content: [
            "API integration between services introduces trust paths, credentials, and network dependencies that must be intentionally governed.",
            "That creates an overlap with CTCH security coursework on prevention and access defense because automation systems themselves become high-value targets.",
          ],
        },
      ],
      bullets: [
        "Automation converts architecture into repeatable operating behavior.",
        "APIs and orchestration expand both speed and attack surface.",
        "Infrastructure as code is a governance tool as much as a delivery tool.",
      ],
      concepts: [
        buildConcept({
          id: "infrastructure-automation",
          name: "Infrastructure Automation",
          explanations: {
            eli10: "Infrastructure automation means using code to build cloud systems the same way every time.",
            intermediate:
              "Infrastructure automation uses templates, scripts, and pipelines to provision and manage cloud environments consistently.",
            advanced:
              "Infrastructure automation operationalizes architecture through declarative or scripted workflows that improve repeatability, auditability, and recovery while reducing manual drift.",
          },
          whatIsIt:
            "The practice of defining and managing infrastructure through code and automated workflows.",
          whyItMatters:
            "Manual configuration does not scale safely and is difficult to audit or reproduce.",
          howItWorks:
            "Templates and APIs define desired state, and automation tools create or update environments to match that state.",
          whereUsed: ["Environment provisioning", "Release pipelines", "Disaster recovery preparation"],
          whatCanGoWrong: [
            "Automating insecure defaults",
            "Embedding secrets in templates",
            "Failing to validate changes before rollout",
          ],
          howSecured: [
            "Protect pipeline identities",
            "Review templates like application code",
            "Use policy checks before deployment",
          ],
          howUMGCTests: [
            "Cloud technology design responses",
            "Workflow analysis prompts",
            "Applied service comparison assignments",
          ],
          relatedConcepts: ["cloud-compute-patterns", "secure-architecture-delivery"],
          crossCourseLinks: [
            {
              courseCode: "CTCH 635",
              topicSlug: "preventive-controls-and-secure-change",
              conceptId: "secure-change-control",
              rationale:
                "Automation becomes a prevention tool only when its change path is secured and governed.",
            },
          ],
        }),
      ],
    }),
  ],
});

const clcs625 = buildCourse({
  slug: "clcs-625-applications-of-cloud-computing",
  code: "CLCS 625",
  title: "Applications of Cloud Computing",
  credits: 3,
  program: "ms-cloud-computing-systems",
  track: "clcs-core",
  prereqs: ["CLCS 605", "CLCS 615"],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Focuses on cloud adoption in applied scenarios, aligning workload patterns, business requirements, and governance decisions.",
  learningOutcomes: [
    "Translate organizational needs into cloud application architecture choices.",
    "Evaluate migration and modernization patterns for application portfolios.",
    "Explain security, resilience, and cost impacts of workload architecture.",
  ],
  cyberOverlap: [
    "Application architecture decisions surface access, data-protection, and threat-exposure concerns.",
    "Bridges cloud design to cyber threat analysis and prevention strategies.",
  ],
  topics: [
    buildTopic({
      slug: "application-modernization-patterns",
      title: "Application Modernization Patterns",
      description:
        "Examines rehost, refactor, and redesign choices for moving applications into cloud-native operating models.",
      umgcWeek: "Week 2",
      assessmentRelevance:
        "Directly supports migration planning, architecture comparison, and modernization case work.",
      objective:
        "Select an application modernization path that matches workload constraints and long-term cloud value.",
      summary:
        "Cloud value is rarely unlocked by simple relocation alone. This topic helps the learner recognize when rehosting is enough, when refactoring is warranted, and when the workload should be reimagined around platform-native capabilities.",
      sections: [
        {
          heading: "Modernization is not one decision",
          content: [
            "Some applications move successfully with minimal change because the goal is consolidation or improved hosting resilience. Others require structural redesign to gain elasticity, automation, and managed-service benefits.",
            "UMGC work in this area should show the learner can justify the migration path with technical and business evidence.",
          ],
        },
        {
          heading: "Application change creates control change",
          content: [
            "Every modernization path affects data handling, identity boundaries, logging, and network exposure. Security and operations requirements must therefore be included in the architecture choice.",
            "This is one of the first strong bridges between cloud application design and cybersecurity threat thinking.",
          ],
        },
      ],
      bullets: [
        "Migration approaches should match workload constraints, not cloud hype.",
        "Refactoring without operational readiness just relocates complexity.",
        "Security and logging changes must be evaluated alongside modernization value.",
      ],
      concepts: [
        buildConcept({
          id: "application-modernization",
          name: "Application Modernization",
          explanations: {
            eli10: "Application modernization means deciding how much to change an old app so it works well in the cloud.",
            intermediate:
              "Application modernization is the process of rehosting, refactoring, or redesigning applications to improve fit for cloud environments.",
            advanced:
              "Application modernization is a portfolio-level transformation discipline that balances migration speed, platform leverage, code change scope, and risk reduction across cloud adoption journeys.",
          },
          whatIsIt:
            "A set of patterns for changing application architecture during cloud migration.",
          whyItMatters:
            "The modernization approach determines how much cloud-native benefit the system can realistically achieve.",
          howItWorks:
            "Architects assess technical debt, coupling, data dependencies, and business urgency before choosing rehost, refactor, or redesign paths.",
          whereUsed: ["Migration planning", "Application portfolio strategy", "Cloud transformation programs"],
          whatCanGoWrong: [
            "Overengineering apps that only need rehosting",
            "Rehosting systems that require deeper redesign",
            "Ignoring security impact during architecture change",
          ],
          howSecured: [
            "Threat-model the new design",
            "Retest access and data boundaries after change",
            "Preserve observability during migration",
          ],
          howUMGCTests: [
            "Migration path recommendations",
            "Case-study evaluations",
            "Architecture tradeoff papers",
          ],
          relatedConcepts: ["workload-fit-analysis", "threat-modeling"],
          crossCourseLinks: [
            {
              courseCode: "CTCH 615",
              topicSlug: "threat-analysis-and-attack-surface",
              conceptId: "attack-surface-analysis",
              rationale:
                "Modernization changes the application attack surface and must be evaluated through threat analysis.",
            },
          ],
        }),
      ],
    }),
    buildTopic({
      slug: "workload-fit-and-governance",
      title: "Workload Fit, Governance, and Cloud Adoption Decisions",
      description:
        "Connects application needs to cost, compliance, resilience, and governance boundaries.",
      umgcWeek: "Week 5",
      assessmentRelevance:
        "Supports recommendation memos and workload suitability analysis for future capstone work.",
      objective:
        "Defend a cloud application approach using workload fit, governance, and risk language together.",
      summary:
        "Not every workload belongs in the same operating model. This topic emphasizes fit assessment so the learner can justify where an application should live, how it should be governed, and what controls must follow it.",
      sections: [
        {
          heading: "Fit assessment prevents forced migration",
          content: [
            "Technical architecture, data sensitivity, latency dependency, and compliance obligations all influence whether a workload should move, stay, or split across environments.",
            "The learner should be able to write recommendations that sound like operating plans, not abstract opinions.",
          ],
        },
        {
          heading: "Governance is part of application success",
          content: [
            "Governance choices around cost monitoring, access boundaries, and logging do not happen after launch. They are part of whether the architecture can be sustained responsibly.",
            "That sets up later capstone and cybersecurity prevention work where design quality is judged by control readiness as well as functionality.",
          ],
        },
      ],
      bullets: [
        "Workload fit analysis keeps cloud architecture grounded in reality.",
        "Governance decisions affect whether cloud benefits remain sustainable.",
        "Resilience, compliance, and cost posture are architecture inputs, not afterthoughts.",
      ],
      concepts: [
        buildConcept({
          id: "workload-fit-analysis",
          name: "Workload Fit Analysis",
          explanations: {
            eli10: "Workload fit analysis means checking whether an application is a good match for a certain cloud setup.",
            intermediate:
              "Workload fit analysis evaluates how well a workload’s technical and business requirements align with a target cloud architecture.",
            advanced:
              "Workload fit analysis is a structured evaluation of workload characteristics against cloud deployment, governance, resilience, and compliance constraints to determine architectural suitability.",
          },
          whatIsIt:
            "A method for deciding whether a workload belongs in a given cloud pattern or environment.",
          whyItMatters:
            "It prevents poor architecture decisions driven by generic migration pressure.",
          howItWorks:
            "Architects compare workload dependencies, sensitivity, performance, and recovery needs against target platform characteristics.",
          whereUsed: ["Cloud migration decisions", "Architecture reviews", "Portfolio planning"],
          whatCanGoWrong: [
            "Moving high-dependency workloads without redesign",
            "Ignoring compliance constraints",
            "Optimizing only for short-term migration speed",
          ],
          howSecured: [
            "Review data sensitivity and access boundaries",
            "Align monitoring and logging to workload criticality",
            "Validate recovery requirements before deployment",
          ],
          howUMGCTests: [
            "Workload recommendation prompts",
            "Architecture comparison assignments",
            "Applied decision memos",
          ],
          relatedConcepts: ["application-modernization", "secure-architecture-delivery"],
        }),
      ],
    }),
  ],
});

const clcs635 = buildCourse({
  slug: "clcs-635-networking-engineering-for-cloud-computing",
  code: "CLCS 635",
  title: "Networking Engineering for Cloud Computing",
  credits: 3,
  program: "ms-cloud-computing-systems",
  track: "clcs-core",
  prereqs: ["CLCS 605", "CLCS 615"],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Develops cloud networking design skill across addressing, connectivity, segmentation, routing, and performance troubleshooting.",
  learningOutcomes: [
    "Design network topologies for cloud workloads and hybrid connectivity.",
    "Explain segmentation, routing, and traffic control in cloud environments.",
    "Evaluate networking decisions for performance, resilience, and defense.",
  ],
  cyberOverlap: [
    "Directly overlaps with network segmentation, access defense, and secure traffic control in CTCH.",
    "Provides network context for secure architecture and prevention strategy work.",
  ],
  topics: [
    buildTopic({
      slug: "cloud-network-topology",
      title: "Cloud Network Topology and Connectivity",
      description:
        "Covers virtual networks, subnets, routing paths, and hybrid connectivity decisions for distributed systems.",
      umgcWeek: "Week 2",
      assessmentRelevance:
        "Supports topology design exercises, architecture diagrams, and troubleshooting analyses.",
      objective:
        "Design a cloud network topology that supports workload communication without exposing unnecessary paths.",
      summary:
        "Cloud networking is not just about reaching services. It is about controlling how traffic enters, exits, and moves laterally between workloads, environments, and on-premises systems.",
      sections: [
        {
          heading: "Topology expresses architecture intent",
          content: [
            "Network design should show what is allowed to communicate, what should stay isolated, and how traffic should be inspected or controlled across environments.",
            "Subnets, routing tables, gateways, and private links become the visible structure of those decisions.",
          ],
        },
        {
          heading: "Hybrid connectivity multiplies design pressure",
          content: [
            "When cloud systems connect to on-premises environments, routing complexity, identity assumptions, and failure modes all expand.",
            "That is why network design work must stay coordinated with security design and workload architecture rather than being treated as a narrow infrastructure concern.",
          ],
        },
      ],
      bullets: [
        "Network topology should reveal trust boundaries and communication intent.",
        "Hybrid connectivity introduces routing and security complexity that must be designed explicitly.",
        "Private connectivity and segmentation are often more important than raw reachability.",
      ],
      concepts: [
        buildConcept({
          id: "cloud-network-topology",
          name: "Cloud Network Topology",
          explanations: {
            eli10: "Cloud network topology is the map of how cloud systems are connected and how traffic can travel between them.",
            intermediate:
              "Cloud network topology defines the virtual network layout, subnets, routes, and connectivity paths used by cloud workloads.",
            advanced:
              "Cloud network topology is the engineered structure of segmented address spaces, route domains, and ingress-egress paths that shape communication, resilience, and control in cloud environments.",
          },
          whatIsIt:
            "The design of a cloud network’s major communication paths and boundaries.",
          whyItMatters:
            "Network shape influences latency, fault isolation, and how easily attackers or failures can move laterally.",
          howItWorks:
            "Virtual networks, subnets, routing, and gateways define which workloads can exchange traffic and under what conditions.",
          whereUsed: ["Cloud architecture diagrams", "Hybrid networking", "Performance troubleshooting"],
          whatCanGoWrong: [
            "Flat address spaces with weak isolation",
            "Exposed management paths",
            "Conflicting routes in hybrid environments",
          ],
          howSecured: [
            "Segment by function and trust level",
            "Restrict ingress paths",
            "Monitor route and gateway changes",
          ],
          howUMGCTests: [
            "Topology diagram assignments",
            "Networking case-study analysis",
            "Architecture troubleshooting prompts",
          ],
          relatedConcepts: ["network-segmentation", "defense-in-depth-networking"],
        }),
      ],
    }),
    buildTopic({
      slug: "segmentation-and-traffic-defense",
      title: "Segmentation, Routing Control, and Traffic Defense",
      description:
        "Explains how segmentation and controlled traffic flow reduce blast radius and improve secure cloud operations.",
      umgcWeek: "Week 5",
      assessmentRelevance:
        "Feeds design responses involving secure architecture, network defense, and availability planning.",
      objective:
        "Use segmentation and traffic control patterns to reduce exposure while maintaining system functionality.",
      summary:
        "Traffic control is where network engineering and security become inseparable. Segmentation determines blast radius, routing determines path exposure, and network controls determine how much inspection or policy enforcement is possible.",
      sections: [
        {
          heading: "Segmentation is an architecture control",
          content: [
            "Subnets, security groups, ACLs, and private service endpoints are not isolated controls. Together they implement trust boundaries and limit lateral movement.",
            "A strong UMGC response should explain why a segment exists, not just that it exists.",
          ],
        },
        {
          heading: "Routing decisions can weaken secure design",
          content: [
            "Overly permissive routes or unneeded transitive connectivity can silently bypass otherwise strong workload controls.",
            "That is why secure network engineering depends on path minimization as much as policy statement accuracy.",
          ],
        },
      ],
      bullets: [
        "Segmentation reduces blast radius only when routes and policies reinforce it.",
        "Traffic control should be justified by trust boundaries and operational need.",
        "Cloud network defense overlaps directly with cyber prevention strategy.",
      ],
      concepts: [
        buildConcept({
          id: "network-segmentation",
          name: "Network Segmentation",
          explanations: {
            eli10: "Network segmentation means splitting a network into smaller safe zones so problems cannot spread everywhere.",
            intermediate:
              "Network segmentation separates systems into distinct communication zones with controlled traffic paths between them.",
            advanced:
              "Network segmentation is the deliberate partitioning of network space into trust-aligned domains enforced by routing, policy, and inspection controls to constrain exposure and lateral movement.",
          },
          whatIsIt:
            "A design technique for limiting which systems can talk and how traffic crosses boundaries.",
          whyItMatters:
            "It reduces attack spread, clarifies policy, and improves fault isolation.",
          howItWorks:
            "Architects use subnet boundaries, security controls, routes, and gateways to create controlled communication zones.",
          whereUsed: ["Cloud VPC/VNet design", "Zero trust networking", "Hybrid connectivity planning"],
          whatCanGoWrong: [
            "Logical segments that remain widely routable",
            "Policy drift across environments",
            "Unmonitored east-west traffic",
          ],
          howSecured: [
            "Default-deny traffic rules",
            "Private connectivity patterns",
            "Segment-level logging and review",
          ],
          howUMGCTests: [
            "Network defense case studies",
            "Cloud design diagrams",
            "Architecture hardening prompts",
          ],
          relatedConcepts: ["cloud-network-topology", "identity-and-access-management"],
          crossCourseLinks: [
            {
              courseCode: "CTCH 625",
              topicSlug: "network-segmentation-and-hardening",
              conceptId: "defense-in-depth-networking",
              rationale:
                "Both programs use segmentation as a primary mechanism for constraining attack movement.",
            },
          ],
        }),
      ],
    }),
  ],
});

const clcs645 = buildCourse({
  slug: "clcs-645-cloud-infrastructure-planning-and-design",
  code: "CLCS 645",
  title: "Cloud Infrastructure Planning and Design",
  credits: 3,
  program: "ms-cloud-computing-systems",
  track: "clcs-core",
  prereqs: ["CLCS 605", "CLCS 615", "CLCS 635"],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Centers on architecture planning, cloud design documentation, resilience strategy, governance, and delivery readiness.",
  learningOutcomes: [
    "Produce cloud architecture plans that integrate business, technical, and security constraints.",
    "Explain resilience, scalability, and governance choices in design documentation.",
    "Prepare implementation-ready architecture with defensible tradeoff reasoning.",
  ],
  capstoneRelevance:
    "Serves as the strongest direct preparation for CLCS 690 by forcing architecture decisions into delivery-ready plans.",
  cyberOverlap: [
    "Strong overlap with threat modeling, prevention strategy, and secure architecture delivery.",
    "Bridges cloud planning directly into cybersecurity design controls.",
  ],
  topics: [
    buildTopic({
      slug: "architecture-planning-and-tradeoffs",
      title: "Architecture Planning and Tradeoff Framing",
      description:
        "Builds the skill of translating requirements into architecture choices with explicit tradeoff language.",
      umgcWeek: "Week 2",
      assessmentRelevance:
        "Directly supports infrastructure design documents, architecture proposals, and capstone preparation.",
      objective:
        "Turn requirements into architecture decisions that can be defended across scale, cost, resilience, and control dimensions.",
      summary:
        "Architecture planning becomes credible when decisions are framed against competing constraints rather than described as universally correct. This topic establishes that design quality depends on explicit tradeoff reasoning.",
      sections: [
        {
          heading: "Requirements create design tension",
          content: [
            "Availability, budget, recovery, performance, compliance, and team capacity often pull architecture in different directions.",
            "The learner must therefore explain what is being optimized, what is being accepted as a compromise, and why those compromises are reasonable.",
          ],
        },
        {
          heading: "Documentation is part of the design",
          content: [
            "An architecture that cannot be communicated clearly is difficult to implement and govern consistently.",
            "Planning artifacts are not paperwork extras. They are the delivery mechanism for design intent.",
          ],
        },
      ],
      bullets: [
        "Good architecture plans make tradeoffs explicit.",
        "Design artifacts should make implementation intent clear enough to operationalize.",
        "Capstone-ready thinking begins when architecture choices are explained under constraint.",
      ],
      concepts: [
        buildConcept({
          id: "architecture-tradeoff-analysis",
          name: "Architecture Tradeoff Analysis",
          explanations: {
            eli10: "Architecture tradeoff analysis means choosing the best design by explaining what you gain and what you give up.",
            intermediate:
              "Architecture tradeoff analysis compares design options across competing goals like cost, performance, resilience, and security.",
            advanced:
              "Architecture tradeoff analysis is the structured evaluation of competing design alternatives against prioritized constraints so decisions remain defensible during implementation and governance.",
          },
          whatIsIt:
            "A method for explaining why one architecture choice is preferred over others.",
          whyItMatters:
            "Cloud infrastructure work is judged by reasoning quality as much as by technical correctness.",
          howItWorks:
            "Architects compare options against requirements, rank impacts, and articulate accepted compromises.",
          whereUsed: ["Design documents", "Architecture review boards", "Capstone proposals"],
          whatCanGoWrong: [
            "Presenting architecture as if there are no tradeoffs",
            "Ignoring operational capacity constraints",
            "Optimizing one metric at the expense of unspoken risk",
          ],
          howSecured: [
            "Include security and governance criteria in every comparison",
            "Use explicit assumptions",
            "Validate design against recovery and access controls",
          ],
          howUMGCTests: [
            "Design justification papers",
            "Proposal critiques",
            "Capstone architecture planning work",
          ],
          relatedConcepts: ["threat-modeling", "secure-architecture-delivery"],
        }),
      ],
    }),
    buildTopic({
      slug: "resilience-governance-and-secure-design",
      title: "Resilience, Governance, and Secure Design Readiness",
      description:
        "Connects design planning to recovery objectives, governance controls, and secure delivery expectations.",
      umgcWeek: "Week 6",
      assessmentRelevance:
        "Supports final design submissions and cross-program overlap with prevention and threat-modeling work.",
      objective:
        "Produce a cloud design posture that is not only functional but governable, recoverable, and secure to deliver.",
      summary:
        "This topic is where architecture planning matures into mission readiness. It insists that resilience, governance, and secure control decisions are part of the design itself and not deferred until operations discovers gaps.",
      sections: [
        {
          heading: "Resilience must be intentional",
          content: [
            "Recovery objectives, fault domains, backups, and failover expectations should be evident in the architecture rather than implied.",
            "If recovery only exists in a narrative appendix, the design is not actually implementation-ready.",
          ],
        },
        {
          heading: "Secure design is a delivery concern",
          content: [
            "Threat modeling, access boundaries, and change-control expectations belong in planning because insecure architecture becomes expensive to repair after deployment.",
            "This is the strongest direct bridge from CLCS design work into CTCH prevention strategy and secure systems thinking.",
          ],
        },
      ],
      bullets: [
        "Recovery posture is part of architecture quality.",
        "Governance controls should appear in the design, not after deployment.",
        "Secure architecture delivery depends on prevention-oriented planning.",
      ],
      concepts: [
        buildConcept({
          id: "secure-architecture-delivery",
          name: "Secure Architecture Delivery",
          explanations: {
            eli10: "Secure architecture delivery means building the system so it is safer before it ever goes live.",
            intermediate:
              "Secure architecture delivery ensures that access, resilience, governance, and change controls are built into the design before implementation.",
            advanced:
              "Secure architecture delivery is the practice of embedding preventive, detective, and recovery-oriented controls into architecture artifacts so implementation inherits a governable security posture by default.",
          },
          whatIsIt:
            "A design approach where security and governance expectations are explicit in the architecture package.",
          whyItMatters:
            "It prevents delivery teams from improvising security after major structural decisions have already been made.",
          howItWorks:
            "Architects encode trust boundaries, access models, logging needs, recovery posture, and change requirements directly into design deliverables.",
          whereUsed: ["Design packages", "Capstone plans", "Architecture governance reviews"],
          whatCanGoWrong: [
            "Security guidance arrives too late to influence structure",
            "Recovery assumptions are undocumented",
            "Implementation teams inherit ambiguous controls",
          ],
          howSecured: [
            "Perform threat modeling during planning",
            "Document least-privilege boundaries",
            "Align delivery workflows with control expectations",
          ],
          howUMGCTests: [
            "Design planning assignments",
            "Capstone readiness work",
            "Secure architecture rationale prompts",
          ],
          relatedConcepts: ["architecture-tradeoff-analysis", "network-segmentation"],
          crossCourseLinks: [
            {
              courseCode: "CTCH 635",
              topicSlug: "threat-modeling-and-preventive-architecture",
              conceptId: "threat-modeling",
              rationale:
                "Secure architecture delivery depends on threat modeling and preventive design choices.",
            },
            {
              courseCode: "CLCS 690",
              topicSlug: "capstone-architecture-delivery",
              conceptId: "capstone-solution-delivery",
              rationale:
                "The capstone expects this concept to be demonstrated as an integrated architecture outcome.",
            },
          ],
        }),
      ],
    }),
  ],
});

const clcs690 = buildCourse({
  slug: "clcs-690-cloud-computing-systems-capstone",
  code: "CLCS 690",
  title: "Cloud Computing Systems Capstone",
  credits: 3,
  program: "ms-cloud-computing-systems",
  track: "clcs-capstone",
  prereqs: ["CLCS 645"],
  semesterOffered: "Placeholder: final-term sequencing",
  description:
    "Integrates the degree into a single applied cloud computing systems delivery problem with architecture, governance, and execution evidence.",
  learningOutcomes: [
    "Synthesize prior cloud systems learning into a coherent solution proposal and delivery plan.",
    "Defend architecture, operations, and security choices in an integrated capstone context.",
    "Present a cloud solution as an executable academic and professional artifact.",
  ],
  capstoneRelevance:
    "This is the terminal integration point for the MS path and the anchor for future planner, tutor, and library features.",
  cyberOverlap: [
    "Capstone delivery should reflect secure architecture, threat-aware design, and defensible operating controls.",
  ],
  topics: [
    buildTopic({
      slug: "capstone-problem-framing",
      title: "Capstone Problem Framing and Solution Scope",
      description:
        "Defines the business problem, cloud solution boundaries, and the decision criteria that justify the capstone direction.",
      umgcWeek: "Phase 1",
      assessmentRelevance:
        "Supports proposal framing, milestone planning, and final integration of prior coursework.",
      objective:
        "Frame the capstone as a solvable cloud systems problem with clear architecture and delivery boundaries.",
      summary:
        "Capstone work succeeds when the problem is scoped tightly enough to solve but richly enough to demonstrate synthesis across architecture, operations, and governance. This topic keeps the project from becoming either vague or unmanageably broad.",
      sections: [
        {
          heading: "Scope determines whether the capstone is finishable",
          content: [
            "A capstone should make room for architecture reasoning, implementation planning, and evidence of value. It should not attempt to recreate an entire enterprise.",
            "Problem framing is therefore a control mechanism for both quality and feasibility.",
          ],
        },
        {
          heading: "Success criteria must be explicit",
          content: [
            "The learner should be able to state what the solution improves, what evidence will count, and how the design will be defended.",
            "That allows the capstone to inherit structure from the rest of the degree rather than feeling detached from it.",
          ],
        },
      ],
      bullets: [
        "A capstone must be scoped tightly enough to deliver.",
        "Success criteria should be measurable and architecture-aware.",
        "Problem framing should expose why cloud is the right operating model.",
      ],
      concepts: [
        buildConcept({
          id: "capstone-solution-delivery",
          name: "Capstone Solution Delivery",
          explanations: {
            eli10: "Capstone solution delivery means turning everything learned in the program into one complete cloud solution plan.",
            intermediate:
              "Capstone solution delivery integrates architecture, implementation planning, and governance into a final applied cloud systems artifact.",
            advanced:
              "Capstone solution delivery is the synthesis of program-level cloud systems learning into a bounded, defensible, implementation-oriented solution with evidence across architecture, operations, and control domains.",
          },
          whatIsIt:
            "The integrated outcome expected from the capstone course.",
          whyItMatters:
            "It demonstrates that the learner can combine isolated course knowledge into one coherent operating system view.",
          howItWorks:
            "The capstone joins problem framing, architecture, security, delivery sequencing, and value articulation into a single solution package.",
          whereUsed: ["Final course deliverables", "Portfolio artifacts", "Professional cloud architecture presentations"],
          whatCanGoWrong: [
            "Scope too broad to finish",
            "Weak integration across prior courses",
            "Security and operations treated as secondary add-ons",
          ],
          howSecured: [
            "Include architecture controls from the start",
            "Trace requirements to design choices",
            "Make governance and risk assumptions explicit",
          ],
          howUMGCTests: [
            "Capstone proposals",
            "Final project documentation",
            "Integrated solution defense",
          ],
          relatedConcepts: ["secure-architecture-delivery", "architecture-tradeoff-analysis"],
          crossCourseLinks: [
            {
              courseCode: "CTCH 635",
              topicSlug: "preventive-controls-and-secure-change",
              rationale:
                "Secure delivery decisions from cybersecurity work should be visible in capstone solution execution.",
            },
          ],
        }),
      ],
    }),
    buildTopic({
      slug: "capstone-architecture-delivery",
      title: "Capstone Architecture, Governance, and Delivery Narrative",
      description:
        "Converts prior planning into a final narrative that explains how the cloud solution can be executed responsibly.",
      umgcWeek: "Phase 2",
      assessmentRelevance:
        "Supports final capstone submission quality and future academic mission-control planning features.",
      objective:
        "Present a final capstone architecture that is technically coherent, governable, and security-aware.",
      summary:
        "The capstone should not read like a loose collection of features. It should read like an architecture program that can actually be delivered, defended, and operated.",
      sections: [
        {
          heading: "Delivery narrative proves synthesis",
          content: [
            "A strong capstone connects problem scope, architecture structure, security reasoning, and rollout logic in a single narrative.",
            "This is where the learner demonstrates that prior courses were not isolated tasks but parts of one academic operating model.",
          ],
        },
      ],
      bullets: [
        "The final narrative should unify architecture, operations, and governance.",
        "Capstone quality depends on traceable reasoning, not only polished diagrams.",
      ],
      concepts: [
        buildConcept({
          id: "integrated-cloud-governance",
          name: "Integrated Cloud Governance",
          explanations: {
            eli10: "Integrated cloud governance means making sure the cloud solution has rules for cost, security, and operations all working together.",
            intermediate:
              "Integrated cloud governance brings cost, access, recovery, and compliance controls into one operating model for a cloud solution.",
            advanced:
              "Integrated cloud governance is the coordinated application of architectural guardrails, access controls, cost oversight, recovery design, and compliance evidence across the full lifecycle of a cloud solution.",
          },
          whatIsIt:
            "The operating control layer that keeps a cloud solution sustainable after design approval.",
          whyItMatters:
            "Capstone solutions should demonstrate not only technical feasibility but operational stewardship.",
          howItWorks:
            "Design artifacts, delivery workflows, and monitoring expectations all align to enforce the intended operating posture.",
          whereUsed: ["Capstone governance sections", "Architecture review", "Operations planning"],
          whatCanGoWrong: [
            "No ownership model after launch",
            "Cost and access drift after implementation",
            "Weak evidence for recovery or compliance claims",
          ],
          howSecured: [
            "Define owners and guardrails",
            "Align audit evidence with architecture choices",
            "Review governance assumptions before implementation",
          ],
          howUMGCTests: [
            "Capstone synthesis",
            "Architecture rationale evaluation",
            "Governance justification sections",
          ],
          relatedConcepts: ["capstone-solution-delivery", "secure-architecture-delivery"],
        }),
      ],
    }),
  ],
});

function electiveSlot(slot: number): UMGCCourse {
  return buildCourse({
    slug: `clcs-elective-slot-${slot}`,
    code: `CLCS ELEC ${slot}`,
    title: `Cloud Computing Elective Slot ${slot}`,
    credits: 3,
    program: "ms-cloud-computing-systems",
    track: "clcs-electives",
    prereqs: [],
    semesterOffered: "Placeholder: pending elective selection",
    description:
      "Reserved elective placeholder for a future UMGC-approved cloud computing systems graduate elective.",
    learningOutcomes: [
      "Hold a deliberate space in the degree map for an eventual elective decision.",
      "Keep planner and roadmap sequencing aligned while the elective set is still undecided.",
    ],
    topics: [
      buildTopic({
        slug: `elective-planning-${slot}`,
        title: "Elective Planning Placeholder",
        description:
          "Maintains roadmap structure until the actual elective course is chosen and populated.",
        umgcWeek: "Placeholder",
        assessmentRelevance:
          "No academic assessment yet; reserved for future planner and course-detail expansion.",
        objective:
          "Protect degree structure without inventing fictional academic content.",
        summary:
          "This placeholder exists so the roadmap can represent the real four-elective requirement without pretending a course choice has already been made.",
        sections: [
          {
            heading: "Why the placeholder exists",
            content: [
              "The MS path includes four elective slots, but the requested scope for this slice does not specify which elective titles should be locked in.",
              "Representing the slots explicitly keeps the academic map honest and prevents the product from drifting back into fictional catalog behavior.",
            ],
          },
        ],
        bullets: [
          "Placeholder slots preserve the real degree requirement.",
          "Actual elective content can be added later without changing roadmap structure.",
        ],
        concepts: [
          buildConcept({
            id: `elective-placeholder-${slot}`,
            name: "Elective Planning Placeholder",
            explanations: {
              eli10: "This is a saved spot for a class that has not been chosen yet.",
              intermediate:
                "An elective placeholder preserves program structure until the learner commits to a specific approved course.",
              advanced:
                "An elective placeholder is a degree-mapping construct that keeps program sequencing accurate while deferring final course selection.",
            },
            whatIsIt: "A structural stand-in for an undecided elective course.",
            whyItMatters:
              "It keeps the roadmap aligned with the real 30-credit program structure without fabricating academic content.",
            howItWorks:
              "The slot behaves like a course container so future planner and data layers can replace it cleanly once an elective is chosen.",
            whereUsed: ["Roadmap sequencing", "Planner foundations", "Academic structure validation"],
            whatCanGoWrong: [
              "Treating the placeholder as final academic content",
              "Losing credit accounting for undecided electives",
            ],
            howSecured: [
              "Label it clearly as pending",
              "Prevent the UI from implying a finalized course choice",
            ],
            howUMGCTests: ["Not applicable until replaced by a real elective"],
            relatedConcepts: [],
          }),
        ],
      }),
    ],
  });
}

export const clcsProgram: Program = {
  id: "ms-cloud-computing-systems",
  code: "CLCS-MS",
  title: "Master of Science in Cloud Computing Systems",
  creditHours: 30,
  type: "master",
  tracks: [
    {
      id: "clcs-core",
      label: "Core",
      courses: [clcs605, clcs615, clcs625, clcs635, clcs645],
    },
    {
      id: "clcs-capstone",
      label: "Capstone",
      courses: [clcs690],
    },
    {
      id: "clcs-electives",
      label: "Electives",
      courses: [electiveSlot(1), electiveSlot(2), electiveSlot(3), electiveSlot(4)],
    },
  ],
};
