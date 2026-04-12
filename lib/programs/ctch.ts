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
  return {
    ...input,
    sourceType: input.sourceType ?? "official-program-structure",
  };
}

const ctch605 = buildCourse({
  slug: "ctch-605-introduction-to-cybersecurity",
  code: "CTCH 605",
  title: "Introduction to Cybersecurity",
  credits: 3,
  program: "graduate-certificate-cybersecurity-technology",
  track: "ctch-required",
  prereqs: [],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Introduces cybersecurity principles, governance, and foundational control thinking for technical environments.",
  learningOutcomes: [
    "Explain basic cybersecurity concepts, governance responsibilities, and control categories.",
    "Connect threat, vulnerability, and risk language to technical systems operation.",
    "Evaluate foundational controls for systems, networks, and cloud environments.",
  ],
  cyberOverlap: [
    "Shares direct ownership language with CLCS 605 shared responsibility work.",
    "Provides the security governance layer that future cloud architecture decisions depend on.",
  ],
  topics: [
    buildTopic({
      slug: "security-governance-and-ownership",
      title: "Security Governance and Control Ownership",
      description:
        "Defines how governance, accountability, and control ownership shape cybersecurity outcomes.",
      umgcWeek: "Week 1",
      assessmentRelevance:
        "Supports introductory cyber analysis and the cloud-security bridge around ownership.",
      objective:
        "Separate policy, operational, and technical ownership clearly enough to analyze security posture.",
      summary:
        "Cybersecurity work becomes more credible when the learner can explain who owns which controls and why. This topic makes accountability visible instead of treating it as background context.",
      sections: [
        {
          heading: "Security ownership drives control quality",
          content: [
            "Controls fail when nobody knows who is responsible for implementing, monitoring, or correcting them.",
            "That makes governance a practical operating concern rather than an abstract management topic.",
          ],
        },
      ],
      bullets: [
        "Security governance should make ownership explicit.",
        "Control gaps often come from accountability gaps before they come from tooling gaps.",
      ],
      concepts: [
        buildConcept({
          id: "security-control-ownership",
          name: "Security Control Ownership",
          explanations: {
            eli10: "Security control ownership means knowing exactly who is supposed to keep each safety rule working.",
            intermediate:
              "Security control ownership identifies which team or role is responsible for implementing and maintaining specific cybersecurity controls.",
            advanced:
              "Security control ownership is the assignment of accountable parties to preventive, detective, and corrective safeguards so governance can be executed and audited effectively.",
          },
          whatIsIt:
            "A governance mechanism for assigning responsibility to cybersecurity controls.",
          whyItMatters:
            "Without ownership, control failures persist because no one is clearly accountable to correct them.",
          howItWorks:
            "Organizations map each control to an owner, define expected evidence, and track deviations through governance processes.",
          whereUsed: ["Security programs", "Audit preparation", "Cloud governance", "Risk management"],
          whatCanGoWrong: [
            "Controls are assumed rather than assigned",
            "Security and operations each think the other owns the issue",
            "Evidence exists but nobody reviews it",
          ],
          howSecured: [
            "Document owners",
            "Review responsibility assignments regularly",
            "Tie incidents back to control accountability",
          ],
          howUMGCTests: [
            "Governance analysis assignments",
            "Responsibility mapping exercises",
            "Control ownership prompts",
          ],
          relatedConcepts: ["risk-management-basics"],
          crossCourseLinks: [
            {
              courseCode: "CLCS 605",
              topicSlug: "shared-responsibility-and-iam",
              conceptId: "shared-responsibility-model",
              rationale:
                "Shared responsibility in cloud computing depends on the same ownership discipline used in cybersecurity governance.",
            },
          ],
        }),
      ],
    }),
    buildTopic({
      slug: "risk-threat-and-vulnerability-basics",
      title: "Risk, Threat, and Vulnerability Basics",
      description:
        "Introduces the relationship between threats, vulnerabilities, and organizational risk.",
      umgcWeek: "Week 3",
      assessmentRelevance:
        "Forms the baseline language needed for later threat analysis and prevention work.",
      objective:
        "Use core risk vocabulary accurately in both security and cloud architecture discussions.",
      summary:
        "This topic establishes the core security language the certificate relies on. It also matters for cloud architecture because threat and vulnerability language is how design weaknesses are often described and prioritized.",
      sections: [
        {
          heading: "Security language must stay precise",
          content: [
            "Threats are not the same as vulnerabilities, and vulnerabilities are not the same as risk. Confusing those terms weakens both analysis and remediation planning.",
            "The learner should be able to connect them in sequence without collapsing them into one generic problem label.",
          ],
        },
      ],
      bullets: [
        "Risk language should connect threat, vulnerability, and impact clearly.",
        "Precise terminology improves remediation and architecture review quality.",
      ],
      concepts: [
        buildConcept({
          id: "risk-management-basics",
          name: "Risk Management Basics",
          explanations: {
            eli10: "Risk management means figuring out what bad thing could happen, why it could happen, and how much it would hurt.",
            intermediate:
              "Risk management basics connect threat, vulnerability, likelihood, and impact to prioritize security action.",
            advanced:
              "Risk management basics provide the analytical model for assessing security exposure by relating threat capability, control weakness, business impact, and mitigation priority.",
          },
          whatIsIt:
            "The core logic used to understand and prioritize cybersecurity concerns.",
          whyItMatters:
            "Security decisions are stronger when they are tied to impact and likelihood rather than only fear or intuition.",
          howItWorks:
            "Analysts identify assets, evaluate threats and vulnerabilities, and then prioritize mitigation based on risk significance.",
          whereUsed: ["Security assessments", "Architecture reviews", "Threat analysis", "Governance reporting"],
          whatCanGoWrong: [
            "Treating every issue as equally urgent",
            "Ignoring business impact",
            "Using vague threat descriptions without control context",
          ],
          howSecured: [
            "Maintain asset and control inventories",
            "Review risk regularly",
            "Tie mitigation to measurable exposure reduction",
          ],
          howUMGCTests: [
            "Vocabulary-based analysis prompts",
            "Risk scenario exercises",
            "Discussion board applications",
          ],
          relatedConcepts: ["security-control-ownership", "attack-surface-analysis"],
        }),
      ],
    }),
  ],
});

const ctch615 = buildCourse({
  slug: "ctch-615-cybersecurity-threats-and-analysis",
  code: "CTCH 615",
  title: "Cybersecurity Threats and Analysis",
  credits: 3,
  program: "graduate-certificate-cybersecurity-technology",
  track: "ctch-required",
  prereqs: ["CTCH 605"],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Builds analytical skill for understanding threat actors, attack surfaces, and the logic behind cybersecurity incidents.",
  learningOutcomes: [
    "Analyze threats and attack surfaces across modern digital systems.",
    "Connect system weaknesses to realistic adversary behavior and impact.",
    "Recommend controls based on structured threat reasoning.",
  ],
  cyberOverlap: [
    "Threat analysis directly informs cloud modernization, design, and capstone architecture decisions.",
  ],
  topics: [
    buildTopic({
      slug: "threat-analysis-and-attack-surface",
      title: "Threat Analysis and Attack Surface",
      description:
        "Examines how systems become exposed to adversaries and how that exposure should be analyzed.",
      umgcWeek: "Week 2",
      assessmentRelevance:
        "Feeds threat analysis exercises and cross-program application modernization reasoning.",
      objective:
        "Describe how architecture decisions create, reduce, or shift attack surface.",
      summary:
        "Security analysis improves when the learner can connect a system’s exposed paths to realistic attacker behavior. This topic makes threat reasoning concrete by focusing on exposure and likely exploitation patterns.",
      sections: [
        {
          heading: "Attack surface is created by design choices",
          content: [
            "Every exposed service, trust path, credential flow, and integration point creates a possible point of interaction for attackers.",
            "This means cloud design decisions are also security decisions because they influence what becomes reachable and exploitable.",
          ],
        },
      ],
      bullets: [
        "Attack surface grows through exposure, trust, and complexity.",
        "Architecture changes should be reviewed for how they alter exposure.",
      ],
      concepts: [
        buildConcept({
          id: "attack-surface-analysis",
          name: "Attack Surface Analysis",
          explanations: {
            eli10: "Attack surface analysis means finding all the doors, windows, and weak spots an attacker might use.",
            intermediate:
              "Attack surface analysis identifies the reachable services, interfaces, credentials, and trust paths that adversaries could target.",
            advanced:
              "Attack surface analysis is the structured assessment of externally and internally reachable assets, trust boundaries, and abuse paths to understand exploitable system exposure.",
          },
          whatIsIt:
            "A method for identifying where a system can be attacked.",
          whyItMatters:
            "If the learner cannot describe exposure clearly, prevention strategy stays generic and weak.",
          howItWorks:
            "Analysts inventory interfaces, privileges, dependencies, and data paths, then map how those can be abused.",
          whereUsed: ["Threat modeling", "Architecture review", "Security assessments", "Incident prevention"],
          whatCanGoWrong: [
            "Ignoring internal attack paths",
            "Treating complexity as harmless",
            "Failing to reassess exposure after modernization",
          ],
          howSecured: [
            "Reduce exposed interfaces",
            "Segment trust zones",
            "Harden access paths and credentials",
          ],
          howUMGCTests: [
            "Threat analysis exercises",
            "Attack-path discussion prompts",
            "System exposure case studies",
          ],
          relatedConcepts: ["threat-modeling", "defensive-access-control"],
          crossCourseLinks: [
            {
              courseCode: "CLCS 625",
              topicSlug: "application-modernization-patterns",
              conceptId: "application-modernization",
              rationale:
                "Modernization choices change application exposure and should be reviewed through attack-surface analysis.",
            },
          ],
        }),
      ],
    }),
    buildTopic({
      slug: "adversary-behavior-and-indicators",
      title: "Adversary Behavior and Analytical Indicators",
      description:
        "Builds the learner’s ability to reason from attacker behavior to defensive interpretation.",
      umgcWeek: "Week 5",
      assessmentRelevance:
        "Supports analytical writeups and control recommendations in later courses.",
      objective:
        "Interpret system signals and behaviors through an adversary-analysis lens.",
      summary:
        "Strong threat analysis is not just naming attackers. It is recognizing how attacker goals, access paths, and observable indicators should shape security decisions.",
      sections: [
        {
          heading: "Behavior gives analysis direction",
          content: [
            "Threat analysis improves when defenders look for behavior patterns instead of waiting for exact signatures or familiar labels.",
            "This matters in cloud systems because rapid change means named indicators age quickly, while behavioral logic remains more durable.",
          ],
        },
      ],
      bullets: [
        "Behavioral reasoning helps defenders stay effective when environments change quickly.",
        "Threat analysis should connect observed indicators to likely attacker goals.",
      ],
      concepts: [
        buildConcept({
          id: "behavioral-threat-analysis",
          name: "Behavioral Threat Analysis",
          explanations: {
            eli10: "Behavioral threat analysis means looking at what an attacker is trying to do, not just what tool they use.",
            intermediate:
              "Behavioral threat analysis evaluates attacker objectives and observable actions to improve defensive interpretation.",
            advanced:
              "Behavioral threat analysis interprets system events through adversary objectives, tactics, and progression patterns to support more resilient defensive decision-making.",
          },
          whatIsIt:
            "An analytical approach focused on what attackers are trying to achieve and how their behavior appears.",
          whyItMatters:
            "Behavior-based reasoning often survives technology change better than static indicator lists.",
          howItWorks:
            "Defenders observe actions such as privilege escalation, unusual access paths, or suspicious movement and infer likely attacker intent.",
          whereUsed: ["Threat hunting", "Incident analysis", "Detection engineering"],
          whatCanGoWrong: [
            "Overfitting behavior to a favorite theory",
            "Ignoring system baseline context",
            "Missing cloud-specific identity abuse signals",
          ],
          howSecured: [
            "Maintain high-quality logging",
            "Correlate identity, network, and workload events",
            "Tune detections around behavior patterns",
          ],
          howUMGCTests: [
            "Threat interpretation assignments",
            "Analytical incident scenarios",
            "Detection reasoning prompts",
          ],
          relatedConcepts: ["attack-surface-analysis"],
        }),
      ],
    }),
  ],
});

const ctch625 = buildCourse({
  slug: "ctch-625-cybersecurity-for-systems-and-networks",
  code: "CTCH 625",
  title: "Cybersecurity for Systems and Networks",
  credits: 3,
  program: "graduate-certificate-cybersecurity-technology",
  track: "ctch-required",
  prereqs: ["CTCH 605", "CTCH 615"],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Applies cybersecurity controls to systems and network environments with emphasis on hardening, access defense, and layered protection.",
  learningOutcomes: [
    "Recommend controls for secure systems and network operations.",
    "Apply access defense and segmentation principles to reduce exposure.",
    "Explain how layered controls support resilient cyber posture.",
  ],
  cyberOverlap: [
    "Direct overlap with cloud IAM, cloud networking, and cloud design security controls.",
  ],
  topics: [
    buildTopic({
      slug: "access-defense-for-systems-and-networks",
      title: "Access Defense for Systems and Networks",
      description:
        "Explains how authentication, authorization, and privilege management protect systems and infrastructure.",
      umgcWeek: "Week 2",
      assessmentRelevance:
        "Supports access control analyses and the bridge to cloud IAM topics.",
      objective:
        "Design defensive access controls that minimize privilege misuse across systems and networks.",
      summary:
        "Access control is one of the most durable cybersecurity themes in the certificate. This topic makes it concrete across both traditional systems and cloud-connected environments.",
      sections: [
        {
          heading: "Access is a system-wide control layer",
          content: [
            "Strong access defense depends on more than password policy. It includes privilege design, trust relationships, account lifecycle, and how access is monitored.",
            "That is why this topic overlaps directly with CLCS identity work instead of living in isolation.",
          ],
        },
      ],
      bullets: [
        "Access defense should be designed around least privilege and visibility.",
        "Privilege misuse is easier to prevent when trust paths are intentionally narrow.",
      ],
      concepts: [
        buildConcept({
          id: "defensive-access-control",
          name: "Defensive Access Control",
          explanations: {
            eli10: "Defensive access control means making sure people and systems can only reach what they really need.",
            intermediate:
              "Defensive access control applies authentication, authorization, and privilege restriction to reduce misuse and compromise risk.",
            advanced:
              "Defensive access control is the layered design of identity verification, privilege governance, trust relationships, and monitoring needed to constrain abuse across systems and networks.",
          },
          whatIsIt:
            "A security approach focused on controlling access scope and accountability.",
          whyItMatters:
            "Compromised or overprivileged access is one of the fastest paths to widespread impact.",
          howItWorks:
            "Users and systems authenticate, privileges are scoped to need, and access actions are monitored for misuse.",
          whereUsed: ["Identity platforms", "Server administration", "Network access control", "Cloud IAM"],
          whatCanGoWrong: [
            "Static privileged accounts",
            "Shared credentials",
            "Weak trust relationships across systems",
          ],
          howSecured: [
            "Least privilege",
            "MFA",
            "Privileged access workflows",
            "Audit logging",
          ],
          howUMGCTests: [
            "Access hardening recommendations",
            "Systems defense analysis",
            "Identity comparison prompts",
          ],
          relatedConcepts: ["defense-in-depth-networking"],
          crossCourseLinks: [
            {
              courseCode: "CLCS 605",
              topicSlug: "shared-responsibility-and-iam",
              conceptId: "identity-and-access-management",
              rationale:
                "Cloud IAM is one implementation context for the same privilege and trust principles.",
            },
          ],
        }),
      ],
    }),
    buildTopic({
      slug: "network-segmentation-and-hardening",
      title: "Network Segmentation and Hardening",
      description:
        "Uses layered network controls to limit exposure and improve secure system operation.",
      umgcWeek: "Week 5",
      assessmentRelevance:
        "Feeds network-defense recommendations and the bridge to CLCS networking architecture.",
      objective:
        "Recommend segmentation and hardening patterns that reduce network attack movement.",
      summary:
        "This topic brings network defense into a practical operating frame. It emphasizes that secure networking depends on limiting unnecessary reachability and reinforcing trust boundaries with multiple controls.",
      sections: [
        {
          heading: "Hardening works best when the path is already constrained",
          content: [
            "A system cannot rely on host hardening alone if the surrounding network remains too permissive.",
            "Segmentation therefore acts as a structural security control that should work alongside endpoint and identity controls.",
          ],
        },
      ],
      bullets: [
        "Segmentation and hardening are stronger together than separately.",
        "Flat networks make both detection and recovery more difficult.",
      ],
      concepts: [
        buildConcept({
          id: "defense-in-depth-networking",
          name: "Defense-in-Depth Networking",
          explanations: {
            eli10: "Defense-in-depth networking means using several layers of network protection instead of trusting one control.",
            intermediate:
              "Defense-in-depth networking combines segmentation, filtering, monitoring, and hardening to protect systems across multiple network layers.",
            advanced:
              "Defense-in-depth networking is the coordinated use of layered traffic controls, segmentation, inspection, and host-aware safeguards to limit exposure and attacker movement across networked systems.",
          },
          whatIsIt:
            "A layered approach to protecting networked systems.",
          whyItMatters:
            "Single-control designs fail more easily when attackers or faults bypass the first line of defense.",
          howItWorks:
            "Traffic is restricted by segment, inspected at boundaries, and supported by endpoint and identity safeguards inside each zone.",
          whereUsed: ["Enterprise networking", "Cloud VPC design", "Hybrid security architecture"],
          whatCanGoWrong: [
            "Relying on one firewall rule set",
            "Leaving east-west traffic unreviewed",
            "Applying inconsistent controls across zones",
          ],
          howSecured: [
            "Layered policy enforcement",
            "Segment-aware logging",
            "Host hardening inside protected zones",
          ],
          howUMGCTests: [
            "Network hardening recommendations",
            "Defense layering prompts",
            "Systems-and-networks security case studies",
          ],
          relatedConcepts: ["defensive-access-control"],
          crossCourseLinks: [
            {
              courseCode: "CLCS 635",
              topicSlug: "segmentation-and-traffic-defense",
              conceptId: "network-segmentation",
              rationale:
                "Both courses use segmentation to control trust boundaries and movement paths.",
            },
          ],
        }),
      ],
    }),
  ],
});

const ctch635 = buildCourse({
  slug: "ctch-635-cybersecurity-attack-prevention-strategies",
  code: "CTCH 635",
  title: "Cybersecurity Attack Prevention Strategies",
  credits: 3,
  program: "graduate-certificate-cybersecurity-technology",
  track: "ctch-required",
  prereqs: ["CTCH 605", "CTCH 615", "CTCH 625"],
  semesterOffered: "Placeholder: confirm with UMGC schedule",
  description:
    "Focuses on preventive cybersecurity strategy, threat-informed architecture, and secure change practices.",
  learningOutcomes: [
    "Recommend preventive controls that reduce attack likelihood and impact.",
    "Use threat modeling to inform design and architecture decisions.",
    "Explain how secure change and architecture discipline prevent avoidable incidents.",
  ],
  cyberOverlap: [
    "Directly overlaps with CLCS design, networking, and capstone architecture delivery.",
  ],
  topics: [
    buildTopic({
      slug: "threat-modeling-and-preventive-architecture",
      title: "Threat Modeling and Preventive Architecture",
      description:
        "Uses threat modeling to shape architecture before systems are deployed or changed.",
      umgcWeek: "Week 2",
      assessmentRelevance:
        "Supports prevention-oriented design work and direct overlap with cloud infrastructure planning.",
      objective:
        "Use threat modeling to improve architecture decisions before delivery locks in risk.",
      summary:
        "Prevention strategy is strongest when it influences design early. Threat modeling helps the learner think about abuse paths, trust boundaries, and likely failures before the system reaches production.",
      sections: [
        {
          heading: "Threat modeling turns security into design input",
          content: [
            "A threat model does not just document fears. It identifies where architecture choices create exploitable paths and where controls should be added or strengthened.",
            "This is the clearest bridge from cybersecurity strategy into CLCS infrastructure planning and capstone readiness.",
          ],
        },
      ],
      bullets: [
        "Threat modeling is most valuable before architecture becomes expensive to change.",
        "Preventive design depends on understanding likely abuse paths early.",
      ],
      concepts: [
        buildConcept({
          id: "threat-modeling",
          name: "Threat Modeling",
          explanations: {
            eli10: "Threat modeling means imagining how someone could break the system before it is finished so you can fix weak spots early.",
            intermediate:
              "Threat modeling is the practice of identifying likely attack paths, trust boundaries, and control gaps in a system design.",
            advanced:
              "Threat modeling is a structured design-time analysis process that evaluates assets, trust boundaries, abuse cases, and mitigations so preventive controls can be embedded before implementation hardens decisions.",
          },
          whatIsIt:
            "A design-focused method for anticipating how a system could be attacked.",
          whyItMatters:
            "It allows teams to prevent avoidable weaknesses before deployment and operational handoff.",
          howItWorks:
            "Architects decompose the system, identify assets and boundaries, reason through abuse paths, and then prioritize mitigations.",
          whereUsed: ["Architecture planning", "Secure design reviews", "Change approval", "Capstone solution design"],
          whatCanGoWrong: [
            "Treating threat modeling as a checklist only",
            "Ignoring identity and data flows",
            "Performing it too late to influence the structure",
          ],
          howSecured: [
            "Include relevant stakeholders early",
            "Revisit models after major architecture changes",
            "Trace mitigations into delivery workflows",
          ],
          howUMGCTests: [
            "Architecture prevention analysis",
            "Design-hardening recommendations",
            "Control planning prompts",
          ],
          relatedConcepts: ["secure-change-control", "attack-surface-analysis"],
          crossCourseLinks: [
            {
              courseCode: "CLCS 645",
              topicSlug: "resilience-governance-and-secure-design",
              conceptId: "secure-architecture-delivery",
              rationale:
                "Threat modeling is one of the main inputs that turns cloud design into secure architecture delivery.",
            },
          ],
        }),
      ],
    }),
    buildTopic({
      slug: "preventive-controls-and-secure-change",
      title: "Preventive Controls and Secure Change",
      description:
        "Connects prevention strategy to change control, automation, and implementation discipline.",
      umgcWeek: "Week 5",
      assessmentRelevance:
        "Feeds secure delivery recommendations and future capstone execution readiness.",
      objective:
        "Explain how secure change and preventive controls work together to lower attack opportunity.",
      summary:
        "Attack prevention is not only about blocking malicious traffic. It is also about making sure routine changes, new integrations, and automated rollouts do not quietly create new weaknesses.",
      sections: [
        {
          heading: "Change control is a prevention mechanism",
          content: [
            "In fast-moving environments, many vulnerabilities are introduced through ordinary change rather than exotic compromise.",
            "Secure change practices therefore belong inside prevention strategy because they keep known-good posture from drifting into risk.",
          ],
        },
      ],
      bullets: [
        "Secure change workflows prevent avoidable exposure from routine delivery.",
        "Preventive controls should be embedded in automation and architecture, not added manually after rollout.",
      ],
      concepts: [
        buildConcept({
          id: "secure-change-control",
          name: "Secure Change Control",
          explanations: {
            eli10: "Secure change control means making sure updates and new setups do not accidentally make the system less safe.",
            intermediate:
              "Secure change control uses review, automation, and guardrails to keep configuration and architecture changes from introducing security weaknesses.",
            advanced:
              "Secure change control is the prevention-oriented governance of system and infrastructure modifications through validated workflows, policy checks, and accountable release practices that reduce security drift.",
          },
          whatIsIt:
            "A control discipline for preventing insecure changes from reaching production.",
          whyItMatters:
            "Many incidents begin with legitimate change executed without sufficient guardrails.",
          howItWorks:
            "Changes move through review, testing, automation, and approval mechanisms that enforce security expectations before deployment.",
          whereUsed: ["DevOps pipelines", "Infrastructure change management", "Security governance"],
          whatCanGoWrong: [
            "Emergency changes become permanent exceptions",
            "Automation bypasses policy review",
            "Teams release quickly without validating access or exposure impacts",
          ],
          howSecured: [
            "Use pipeline policy checks",
            "Limit privileged release paths",
            "Audit and expire exceptions",
          ],
          howUMGCTests: [
            "Prevention strategy recommendations",
            "Change-control critiques",
            "Secure architecture execution prompts",
          ],
          relatedConcepts: ["threat-modeling"],
          crossCourseLinks: [
            {
              courseCode: "CLCS 615",
              topicSlug: "automation-and-service-integration",
              conceptId: "infrastructure-automation",
              rationale:
                "Cloud automation becomes safer and more valuable when it inherits secure change controls.",
            },
            {
              courseCode: "CLCS 690",
              topicSlug: "capstone-architecture-delivery",
              conceptId: "capstone-solution-delivery",
              rationale:
                "Capstone delivery should demonstrate secure change thinking instead of only technical solution assembly.",
            },
          ],
        }),
      ],
    }),
  ],
});

export const ctchProgram: Program = {
  id: "graduate-certificate-cybersecurity-technology",
  code: "CTCH-CERT",
  title: "Graduate Certificate in Cybersecurity Technology",
  creditHours: 12,
  type: "certificate",
  tracks: [
    {
      id: "ctch-required",
      label: "Certificate Required",
      courses: [ctch605, ctch615, ctch625, ctch635],
    },
  ],
};
