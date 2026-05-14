import { Program, UMGCCourse, CourseTopic, Concept as BaseConcept } from "@/lib/types";

/* ── Deep-concept types for course-material-derived knowledge ── */

export type ConceptDepth = {
  eli10: string;
  intermediate: string;
  advanced: string;
};

export type Concept = {
  id: string;
  title: string;
  sourceType: "course-material-derived" | "placeholder";
  depth: ConceptDepth;
  whatIsIt: string;
  whyItMatters: string;
  howItWorks: string;
  whereUsed: string;
  whatCanGoWrong: string;
  howSecured: string;
  howUMGCTests: string;
  diagramSpec: string;
  relatedConcepts: string[];
  crossCourseLinks: string[];
};

export type UnitTopic = {
  id: string;
  title: string;
  slug: string;
  sourceType: "course-material-derived" | "placeholder";
  concepts: Concept[];
};

export type LearnerSuccessResource = {
  title: string;
  description: string;
  actionUrl: string | null;
};

/* ── Helpers ── */

function buildConcept(input: Omit<BaseConcept, "relatedConcepts" | "crossCourseLinks"> & {
  relatedConcepts?: string[];
  crossCourseLinks?: BaseConcept["crossCourseLinks"];
}): BaseConcept {
  return {
    ...input,
    relatedConcepts: input.relatedConcepts ?? [],
    crossCourseLinks: input.crossCourseLinks ?? [],
  };
}

function deepToBaseConcept(c: Concept): BaseConcept {
  return {
    id: c.id,
    name: c.title,
    explanations: c.depth,
    whatIsIt: c.whatIsIt,
    whyItMatters: c.whyItMatters,
    howItWorks: c.howItWorks,
    whereUsed: [c.whereUsed],
    whatCanGoWrong: [c.whatCanGoWrong],
    howSecured: [c.howSecured],
    howUMGCTests: [c.howUMGCTests],
    diagramSpec: c.diagramSpec,
    relatedConcepts: c.relatedConcepts,
    crossCourseLinks: c.crossCourseLinks.map((link) => {
      const match = link.match(/^(CLCS|CTCH)\s+\d+/);
      return { courseCode: match?.[0] ?? "", rationale: link };
    }),
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

/* ── CLCS 605 Deep Topics (course-material-derived) ── */

export const clcs605LearningGoals: string[] = [
  "Analyze organizational infrastructure needs and align with appropriate cloud computing strategies",
  "Evaluate IaaS, PaaS, SaaS service models and public, private, hybrid deployment configurations",
  "Assess cloud security risks and employ IAM, data protection, and network security controls",
  "Plan scalable and cost-optimized cloud infrastructure using architecture principles and serverless patterns",
  "Explain cloud development, deployment, integration, migration, and post-deployment operations",
  "Explain cloud automation, orchestration, monitoring, backup, and disaster recovery solutions",
];

export const clcs605LearnerSuccessResources: LearnerSuccessResource[] = [
  {
    title: "Using Brightspace Pulse",
    description:
      "Download the Brightspace Pulse mobile app to track deadlines, get grade notifications, and read announcements. Use desktop for submitting assignments and taking quizzes.",
    actionUrl: null,
  },
  {
    title: "Checking Rubrics and Feedback",
    description:
      "After each graded item go to Grades, click the assignment, and find View Graded Rubric. Read every criterion before you start writing so you know exactly what Exceeds Expectations looks like.",
    actionUrl: null,
  },
  {
    title: "Respectful Online Communication",
    description:
      "All posts must be professional. Cite sources. Do not share personal information about peers. Re-read before posting. Your digital communication is part of your professional reputation.",
    actionUrl: null,
  },
  {
    title: "Citation and Academic Integrity",
    description:
      "Every factual claim needs an APA citation. Turnitin runs automatically on all submissions. Use Turnitin Draft Coach in Microsoft Word before submitting to check similarity. Drafts checked there are not stored in Turnitin’s database.",
    actionUrl: null,
  },
  {
    title: "AI Use Honesty",
    description:
      "UMGC permits AI for brainstorming, background research, and concept clarification. Any AI-generated content submitted must be cited. Add a statement at the end of your assignment explaining how you used AI. When unsure ask your professor first.",
    actionUrl: null,
  },
];

export const clcs605DeepTopics: UnitTopic[] = [
  /* ── Unit 1: Fundamentals of Cloud Computing ── */
  {
    id: "unit-1",
    title: "Fundamentals of Cloud Computing",
    slug: "fundamentals-of-cloud-computing",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "nist-cloud-definition",
        title: "NIST Definition and Essential Characteristics",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Cloud computing is like renting a supercomputer instead of buying one. You only pay for what you use, you can get more power instantly, and you can reach it from anywhere.",
          intermediate:
            "NIST defines cloud computing as on-demand network access to shared configurable computing resources that can be rapidly provisioned with minimal management effort. The five essential characteristics are on-demand self-service, broad network access, resource pooling, rapid elasticity, and measured service.",
          advanced:
            "The NIST SP 800-145 definition establishes cloud computing as a model rather than a technology, with essential characteristics that distinguish it from traditional hosting. On-demand self-service eliminates provisioning workflows. Broad network access enables platform-agnostic consumption. Resource pooling uses multi-tenancy with location independence. Rapid elasticity enables horizontal scaling that appears infinite to the consumer. Measured service creates pay-per-use economics through metered resource consumption.",
        },
        whatIsIt:
          "The authoritative NIST definition of cloud computing and its five essential characteristics that distinguish cloud from traditional IT infrastructure.",
        whyItMatters:
          "Every cloud architecture decision traces back to these five characteristics. Understanding them lets you evaluate whether a proposed solution is truly cloud-native or just hosted infrastructure.",
        howItWorks:
          "A cloud provider builds massive shared infrastructure. Virtualization abstracts physical hardware. Automation handles provisioning. Metering tracks consumption. The consumer interacts through APIs and self-service portals without touching physical hardware.",
        whereUsed:
          "Used in every CLCS 605 discussion post, assignment, and quiz as the foundational framework for evaluating cloud solutions.",
        whatCanGoWrong:
          "Misclassifying hosted infrastructure as cloud. Assuming on-premises virtualization is cloud. Conflating cloud with outsourcing.",
        howSecured:
          "The NIST model itself addresses security through the shared responsibility model — provider secures infrastructure, consumer secures data and access.",
        howUMGCTests:
          "Unit 1 Discussion asks you to analyze how the five essential characteristics interact to enable organizational transformation. Unit 1 Quiz tests scenario-based application of service and deployment models.",
        diagramSpec:
          "Five concentric circles: center = measured service, then rapid elasticity, resource pooling, broad network access, outer = on-demand self-service. Each layer enables the next.",
        relatedConcepts: ["cloud-service-models", "cloud-deployment-models", "virtualization"],
        crossCourseLinks: ["CLCS 615 Unit 1: same NIST framework applied to service selection decisions"],
      },
      {
        id: "cloud-service-models",
        title: "Cloud Service Models",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "IaaS gives you the building blocks like walls and floors. PaaS gives you a furnished room. SaaS gives you a hotel room — everything is ready, you just move in.",
          intermediate:
            "IaaS provides virtualized compute, storage, and networking — you manage OS upward. PaaS adds runtime, middleware, and development tools — you manage application and data. SaaS delivers the full application — you manage only your configuration and data.",
          advanced:
            "The service model determines the shared responsibility boundary. In IaaS the consumer controls everything above the hypervisor, creating maximum flexibility and maximum responsibility — relevant to Peter’s EC2 and EKS work. PaaS abstracts infrastructure management enabling faster deployment cycles at the cost of runtime control. SaaS shifts nearly all security and operational responsibility to the provider. The boundary implications are critical for IAM design, compliance scope, and incident response planning.",
        },
        whatIsIt:
          "The three primary cloud service models — IaaS, PaaS, SaaS — defining the division of management responsibility between provider and consumer.",
        whyItMatters:
          "Service model selection determines your security responsibilities, operational overhead, and architectural flexibility. Wrong model selection creates security gaps and cost overruns.",
        howItWorks:
          "Each layer builds on the previous. IaaS virtualizes hardware. PaaS adds managed runtime on top of IaaS. SaaS adds application logic on top of PaaS. Each additional layer the provider manages reduces consumer control and operational burden.",
        whereUsed:
          "AWS EC2 is IaaS. AWS Elastic Beanstalk is PaaS. AWS Managed Services and SaaS products like Salesforce. Peter’s EKS clusters run on IaaS with container orchestration as a PaaS-like abstraction.",
        whatCanGoWrong:
          "Assuming SaaS providers handle all security. Not understanding where your responsibility starts in IaaS. Choosing PaaS when you need low-level OS access.",
        howSecured:
          "IaaS: you own network controls, OS hardening, and IAM. PaaS: provider handles OS, you handle app security and data. SaaS: provider handles almost everything, you handle access management and data governance.",
        howUMGCTests:
          "CLCS 615 Unit 1 Assignment directly tests your ability to evaluate IaaS, PaaS, SaaS from a cybersecurity perspective. CLCS 605 quizzes include scenario-based service model selection questions.",
        diagramSpec:
          "Vertical stack diagram. Bottom: Physical Hardware. Layer 2: Virtualization. Layer 3: IaaS boundary. Layer 4: Runtime/Middleware. Layer 5: PaaS boundary. Layer 6: Application. Layer 7: SaaS boundary. Provider manages below each boundary, consumer manages above.",
        relatedConcepts: ["nist-cloud-definition", "cloud-deployment-models", "shared-responsibility-model"],
        crossCourseLinks: [
          "CLCS 615 Unit 1 Assignment: evaluate service models from cybersecurity perspective",
          "CLCS 625: security implications of each service model",
        ],
      },
      {
        id: "cloud-deployment-models",
        title: "Cloud Deployment Models",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Public cloud is like renting a desk in a co-working space. Private cloud is like having your own private office. Hybrid is having both and moving between them. Multi-cloud is renting desks in different buildings.",
          intermediate:
            "Public cloud is multi-tenant infrastructure owned by a provider — AWS, Azure, GCP. Private cloud is single-tenant infrastructure controlled by one organization. Hybrid connects public and private with orchestration. Community cloud is shared among organizations with common requirements. Multi-cloud uses multiple providers to avoid vendor lock-in.",
          advanced:
            "Deployment model selection is fundamentally a governance and risk decision. Public cloud maximizes elasticity and minimizes capital expenditure but creates data residency and compliance considerations. Private cloud meets strict regulatory requirements at the cost of elasticity. Hybrid enables workload portability and data sovereignty for regulated data while leveraging public cloud elasticity for non-sensitive workloads — the dominant enterprise pattern. Multi-cloud reduces vendor dependency and enables best-of-breed service selection at the cost of operational complexity.",
        },
        whatIsIt:
          "The four cloud deployment models defining infrastructure ownership, tenancy, and access control.",
        whyItMatters:
          "Deployment model determines where data physically resides, who has access to infrastructure, and what compliance frameworks apply.",
        howItWorks:
          "Public: provider owns and operates shared infrastructure accessed over internet. Private: organization owns or leases dedicated infrastructure. Hybrid: orchestration layer connects public and private enabling workload portability. Multi-cloud: management plane spans multiple providers.",
        whereUsed:
          "Most enterprises use hybrid or multi-cloud. Peter’s production work likely uses public cloud with private network controls. Healthcare and government typically require private or community cloud for regulated data.",
        whatCanGoWrong:
          "Assuming public cloud is always less secure. Not planning data residency in hybrid. Multi-cloud creating unmanaged shadow IT. Hybrid integration failures exposing private data.",
        howSecured:
          "Public: provider physical security plus consumer logical security. Private: full stack consumer responsibility. Hybrid: security controls must span both environments consistently. Multi-cloud: unified identity and access management across providers.",
        howUMGCTests:
          "CLCS 615 Unit 3 Assignment: design cloud strategy for regulated healthcare organization — requires deployment model justification with governance reasoning.",
        diagramSpec:
          "Four quadrants: top-left Public (AWS/Azure/GCP logos, multi-tenant), top-right Private (single org, dedicated), bottom-left Hybrid (arrow connecting public and private), bottom-right Multi-cloud (multiple provider logos connected).",
        relatedConcepts: ["cloud-service-models", "nist-cloud-definition", "cloud-governance"],
        crossCourseLinks: [
          "CLCS 615 Unit 3: governance-focused cloud strategy",
          "CLCS 625: compliance implications of each deployment model",
        ],
      },
      {
        id: "virtualization",
        title: "Virtualization",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Virtualization is like having one powerful computer pretend to be ten separate computers at the same time. Each person thinks they have their own computer but they are all sharing the same machine.",
          intermediate:
            "Virtualization creates an abstraction layer between applications and physical hardware using a hypervisor. Type 1 hypervisors run directly on hardware. Type 2 run on an OS. Virtual machines share physical resources while maintaining isolation. Containerization extends this by sharing the OS kernel.",
          advanced:
            "IBM introduced virtual machines in 1967 with CP-67. Modern cloud platforms use Type 1 hypervisors for VM isolation and container runtimes for lightweight application packaging. The key architectural insight is that virtualization enables resource pooling — one of NIST’s essential characteristics. Containerization via Docker packages applications with dependencies ensuring environmental consistency. Kubernetes orchestrates containers at scale — directly relevant to Peter’s EKS production work. The transition from VMs to containers to serverless represents progressive abstraction of infrastructure management.",
        },
        whatIsIt:
          "The technology that abstracts physical hardware into virtual resources, enabling the resource pooling and elasticity that makes cloud computing possible.",
        whyItMatters:
          "Without virtualization there is no cloud computing. Every AWS EC2 instance, every Docker container, every EKS node traces back to virtualization as the foundational technology.",
        howItWorks:
          "Hypervisor sits between physical hardware and virtual machines. It allocates CPU, memory, storage, and network as virtual resources. Each VM has its own OS. Containers share the host OS kernel through namespaces and cgroups, making them lighter than VMs.",
        whereUsed:
          "AWS EC2 uses Nitro hypervisor. Docker containers use Linux namespaces. Peter’s EKS clusters run containerized workloads on EC2 instances — stacked virtualization.",
        whatCanGoWrong:
          "VM sprawl — unmanaged proliferation of virtual machines consuming resources. Container escape vulnerabilities. Hypervisor attacks. Noisy neighbor problems in shared infrastructure.",
        howSecured:
          "Hypervisor isolation between VMs. Container security using Trivy for image scanning — Peter uses this daily. Network policies in Kubernetes for pod isolation. Gitleaks for secret scanning in container images.",
        howUMGCTests:
          "CLCS 605 Unit 1 learning resources include IEEE paper on cloud computing history and virtualization. Quiz questions test understanding of how virtualization enables cloud characteristics.",
        diagramSpec:
          "Vertical stack: Physical Server at bottom, Hypervisor layer, then multiple VM boxes side by side each containing OS and App. Separate column shows Container Host with shared OS kernel and multiple lightweight container boxes.",
        relatedConcepts: ["nist-cloud-definition", "cloud-service-models", "containerization"],
        crossCourseLinks: [
          "CLCS 635: container orchestration and DevOps",
          "CTCH 605: VM and container security",
        ],
      },
    ],
  },

  /* ── Unit 2: Cloud Security and Compliance ── */
  {
    id: "unit-2",
    title: "Cloud Security and Compliance",
    slug: "cloud-security-and-compliance",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "iam-and-access-control",
        title: "Identity and Access Management",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "IAM is like the security guard and keycard system for cloud resources. It controls who can get in, what rooms they can enter, and what they can do inside each room.",
          intermediate:
            "IAM defines authentication (who are you) and authorization (what can you do). Cloud IAM uses policies attached to identities — users, groups, roles, and service accounts. Least privilege is the core principle: grant only the minimum permissions needed. AWS IAM uses policies in JSON format. Azure uses RBAC. Google Cloud uses IAM with predefined and custom roles.",
          advanced:
            "IAM is the primary attack surface in cloud environments. Misconfigured IAM is the leading cause of cloud breaches. The shared responsibility model places IAM entirely in the consumer’s responsibility across all service models. Key concepts: identity federation using SAML or OIDC for SSO, cross-account role assumption in AWS, service account security, permission boundaries, attribute-based access control (ABAC) vs role-based access control (RBAC). Peter’s daily work with ArgoCD requires service account IAM design. Checkov scans IaC for IAM misconfigurations. The Unit 2 assignment directly tests IAM design in a business scenario.",
        },
        whatIsIt:
          "The framework of policies, roles, and controls that govern who can access cloud resources and what actions they can perform.",
        whyItMatters:
          "IAM misconfiguration is the number one cause of cloud data breaches. Proper IAM design is the foundation of every security control in cloud environments.",
        howItWorks:
          "Every API call to a cloud provider is authenticated and authorized. The caller presents credentials — access key, OAuth token, or instance role. The provider evaluates attached policies against the requested action and resource. Allow or deny decision is made. In AWS this flows through IAM policy evaluation logic: explicit deny wins, then explicit allow, then implicit deny.",
        whereUsed:
          "AWS IAM for all AWS service access. Azure RBAC for Azure resources. Kubernetes RBAC for pod and namespace access — Peter’s EKS clusters use both AWS IAM and Kubernetes RBAC simultaneously. ArgoCD uses service accounts with scoped Kubernetes RBAC.",
        whatCanGoWrong:
          "Overprivileged roles — giving AdministratorAccess instead of scoped permissions. Hardcoded credentials in code — Gitleaks catches this. Unused access keys never rotated. Public S3 buckets from misconfigured bucket policies. Cross-account role trust policy errors.",
        howSecured:
          "Least privilege by default. MFA on all human identities. No long-term access keys for applications — use IAM roles. Regular access reviews. Checkov scans Terraform for IAM misconfigurations before deployment. CloudTrail logs all IAM API calls.",
        howUMGCTests:
          "CLCS 605 Unit 2 Assignment: Cloud IAM and Data Security Design — implement IAM controls for a business scenario using a provided template. This is a hands-on design assignment worth 100 points.",
        diagramSpec:
          "Central resource box. Arrows from: User with MFA badge, Service Account with role badge, External System with federation badge. Each arrow passes through an IAM Policy evaluation box showing Allow or Deny. CloudTrail logging box captures all.",
        relatedConcepts: ["cloud-security-compliance", "zero-trust-architecture", "shared-responsibility-model"],
        crossCourseLinks: [
          "CLCS 615 Unit 4: security architecture including IAM design",
          "CLCS 625: advanced IAM security",
          "CTCH courses: identity-centric security",
        ],
      },
      {
        id: "cloud-data-security",
        title: "Cloud Data Security",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Cloud data security is like putting your documents in a locked safe, making copies in different locations, and keeping a record of everyone who opened the safe.",
          intermediate:
            "Cloud data security covers encryption at rest and in transit, data classification, access controls, and compliance requirements. Encryption at rest uses AES-256 in most cloud providers. Encryption in transit uses TLS 1.2 or 1.3. Data loss prevention policies scan for sensitive data patterns. Backup and versioning protect against ransomware and accidental deletion.",
          advanced:
            "Data security in cloud requires understanding the encryption key management hierarchy. AWS KMS manages customer master keys with automated rotation. Client-side encryption keeps keys entirely in consumer control. Data residency requirements in regulated industries constrain deployment model choices. GDPR, HIPAA, and SOC2 compliance frameworks impose specific encryption, access logging, and retention requirements. Tokenization and data masking protect sensitive fields in non-production environments. Peter’s SCS-C02 certification covers AWS data protection services in depth.",
        },
        whatIsIt:
          "The controls, encryption, and policies that protect data stored in and transmitted through cloud environments.",
        whyItMatters:
          "Data is the primary target of cloud attacks. Encryption, access controls, and monitoring are the three pillars of preventing, detecting, and responding to data breaches.",
        howItWorks:
          "Data is classified by sensitivity. Encryption keys are managed through KMS. Access policies restrict who can read or write data. Audit logs capture all data access events. DLP tools scan for sensitive data leaving controlled environments.",
        whereUsed:
          "S3 server-side encryption. RDS encryption at rest. TLS for all API communications. AWS Macie for sensitive data discovery. SonarCloud in Peter’s pipeline scans for secrets in code — related to preventing data exposure through code.",
        whatCanGoWrong:
          "Unencrypted S3 buckets. Weak or default encryption keys. Missing TLS on internal APIs. Overly broad data access policies. No data classification leading to sensitive data in dev environments.",
        howSecured:
          "Enforce encryption by default through AWS Config rules. Use KMS with automatic key rotation. Implement S3 bucket policies blocking public access. Enable CloudTrail and S3 access logging. Use AWS Macie for PII discovery.",
        howUMGCTests:
          "CLCS 605 Unit 2 Assignment combines IAM and data security design. CLCS 615 Unit 2 Assignment evaluates SLAs for business-critical applications including data protection commitments.",
        diagramSpec:
          "Data flow diagram: Data created → Classification tag applied → Encryption at rest (KMS key) → Stored in S3/RDS → Access request → IAM policy check → Audit log entry → Data transmitted with TLS → Destination.",
        relatedConcepts: ["iam-and-access-control", "cloud-compliance", "encryption-key-management"],
        crossCourseLinks: [
          "CLCS 625: advanced data security",
          "CTCH 615: network-level data protection",
        ],
      },
    ],
  },

  /* ── Unit 3: Cloud Strategy and Security Implementation ── */
  {
    id: "unit-3",
    title: "Cloud Strategy and Security Implementation",
    slug: "cloud-strategy-and-security-implementation",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "cloud-security-strategy",
        title: "Cloud Security Strategy",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "A cloud security strategy is like a plan for keeping your house safe. You decide where to put locks, cameras, and alarms before you move in — not after something goes wrong.",
          intermediate:
            "Cloud security strategy defines the security principles, frameworks, and controls before cloud deployment. It includes choosing compliance frameworks like NIST CSF or ISO 27001, defining the shared responsibility model boundaries, establishing security baselines, and planning incident response.",
          advanced:
            "Effective cloud security strategy follows a defense-in-depth model. The strategy must address identity, network, data, application, and infrastructure layers simultaneously. Zero trust architecture assumes no implicit trust even inside the network perimeter. The strategy must align with business objectives — security controls that block productivity create shadow IT that increases risk. Peter’s DevSecOps background means he already implements shift-left security — integrating Trivy, Checkov, and OWASP ZAP in CI/CD pipelines before deployment. This is the practical implementation of a security strategy.",
        },
        whatIsIt:
          "A comprehensive plan defining security principles, controls, frameworks, and responsibilities for cloud environments before and during deployment.",
        whyItMatters:
          "Organizations that deploy cloud without a security strategy consistently experience breaches from misconfiguration, not sophisticated attacks. Strategy prevents the most common and costly failures.",
        howItWorks:
          "Define security requirements from business and compliance needs. Map to a framework like NIST CSF or CIS Benchmarks. Establish baseline controls for each cloud service. Automate compliance checking with tools like Checkov for IaC. Implement continuous monitoring with CloudWatch and Security Hub. Define incident response procedures.",
        whereUsed:
          "Every enterprise cloud deployment. Peter’s DevSecOps pipeline implements automated security strategy — Trivy scans images, Checkov scans IaC, OWASP ZAP tests running applications.",
        whatCanGoWrong:
          "Security as an afterthought added post-deployment. Compliance checkbox mentality without actual risk reduction. Security controls not aligned with developer workflows creating bypass behavior.",
        howSecured:
          "Shift-left security integration. Automated policy enforcement through IaC scanning. Continuous compliance monitoring. Regular security assessments and penetration testing.",
        howUMGCTests:
          "CLCS 605 Unit 3 Quiz: Comprehensive Cloud Knowledge Assessment. CLCS 615 Unit 3 Assignment: design governance-focused cloud strategy for a regulated healthcare organization.",
        diagramSpec:
          "Security layers diagram: outer ring = Governance and Compliance, next = Network Security, next = Identity and Access, next = Data Protection, center = Application Security. All layers connected to central Monitoring and Response hub.",
        relatedConcepts: ["iam-and-access-control", "cloud-data-security", "zero-trust-architecture"],
        crossCourseLinks: [
          "CLCS 615 Unit 3: comprehensive cloud strategy development",
          "CLCS 625: full security architecture course",
        ],
      },
    ],
  },

  /* ── Unit 4: Cloud Architecture and Design ── */
  {
    id: "unit-4",
    title: "Cloud Architecture and Design",
    slug: "cloud-architecture-and-design",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "cloud-architecture-principles",
        title: "Cloud Architecture Principles",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Cloud architecture principles are the rules architects follow to build systems that stay up, can grow, and do not cost more than necessary. Like building rules for a skyscraper — safety, flexibility, and efficiency.",
          intermediate:
            "Cloud architecture principles include high availability through redundancy, fault tolerance through graceful degradation, scalability through horizontal scaling, cost optimization through right-sizing and reserved capacity, and security through defense in depth. AWS Well-Architected Framework organizes these into five pillars: operational excellence, security, reliability, performance efficiency, and cost optimization.",
          advanced:
            "Architecture principles must be expressed as constraints that guide design decisions. High availability requires understanding of failure domains — availability zones and regions. Fault tolerance requires circuit breakers, bulkheads, and retry logic with exponential backoff. Scalability in cloud-native systems uses horizontal scaling with stateless services and externalized state in managed databases or caches. Cost optimization at architecture level means choosing the right service type — reserved instances for steady-state workloads, spot for fault-tolerant batch, serverless for variable workloads. The Unit 4 assignment directly tests cost optimization planning.",
        },
        whatIsIt:
          "The foundational design principles that guide cloud architecture decisions to achieve reliability, security, performance, and cost efficiency.",
        whyItMatters:
          "Architecture decisions made early are expensive to reverse. Applying the right principles from the start prevents costly redesigns and outages.",
        howItWorks:
          "Each principle translates to specific architectural patterns. High availability means deploying across multiple availability zones. Fault tolerance means implementing retry logic and circuit breakers. Cost optimization means matching instance types to workload patterns and using auto-scaling.",
        whereUsed:
          "Every production cloud deployment. Peter’s EKS clusters implement high availability through multi-AZ node groups. ArgoCD implements GitOps for operational excellence.",
        whatCanGoWrong:
          "Single points of failure from single-AZ deployments. Cost overruns from over-provisioned instances never right-sized. Performance bottlenecks from stateful services that cannot scale horizontally.",
        howSecured:
          "Architecture-level security includes network segmentation through VPCs and security groups, encryption by default, IAM least privilege, and infrastructure as code for repeatable secure deployments.",
        howUMGCTests:
          "CLCS 605 Unit 4 Assignment: Cloud Cost Optimization Plan — directly tests ability to analyze resource utilization and recommend optimization strategies. Worth 125 points.",
        diagramSpec:
          "Multi-AZ architecture diagram: Region box containing two AZ boxes. Each AZ has web tier, app tier, database tier. Load balancer spans AZs. Auto-scaling groups in app tier. RDS Multi-AZ for database. Cost tags on each resource layer.",
        relatedConcepts: ["cloud-security-strategy", "serverless-architecture", "cost-optimization"],
        crossCourseLinks: [
          "CLCS 615 Unit 4: cloud architecture and design principles",
          "CLCS 635: DevOps and architecture automation",
        ],
      },
    ],
  },

  /* ── Unit 5: Cloud Design and Implementation Strategies ── */
  {
    id: "unit-5",
    title: "Cloud Design and Implementation Strategies",
    slug: "cloud-design-and-implementation-strategies",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "cloud-migration-strategies",
        title: "Cloud Migration Strategies",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Cloud migration is like moving house. You can move everything at once, move room by room, rebuild everything from scratch in the new place, or just rent furniture at the new place instead of bringing your old stuff.",
          intermediate:
            "The 6 Rs of cloud migration: Rehost (lift and shift), Replatform (lift and reshape), Repurchase (drop and shop to SaaS), Refactor or Re-architect (redesign for cloud-native), Retire (decommission unused applications), Retain (keep on-premises). Each strategy trades migration speed against cloud optimization.",
          advanced:
            "Migration strategy selection requires total cost of ownership analysis across time horizons. Rehost delivers fastest migration but leaves cloud economics unrealized — workloads run in cloud but behave like on-premises. Refactoring unlocks cloud-native patterns — auto-scaling, managed services, serverless — but requires development investment. The Wave approach migrates workloads in prioritized batches based on complexity and business value. Peter’s background in containerization positions him to lead replatforming efforts — taking existing applications and containerizing them for EKS without full refactoring.",
        },
        whatIsIt:
          "The strategic frameworks and tactical approaches for moving applications and data from on-premises or legacy environments to cloud infrastructure.",
        whyItMatters:
          "Migration strategy determines the balance between speed to cloud and realization of cloud economic and operational benefits.",
        howItWorks:
          "Assess current application portfolio. Classify each application using the 6 Rs. Prioritize migration waves by business value and technical complexity. Execute migrations. Validate performance and cost post-migration. Optimize continuously.",
        whereUsed:
          "Enterprise cloud adoption programs. AWS Migration Hub tracks migration progress. AWS Application Migration Service automates lift and shift. Peter’s containerization skills are directly applicable to replatforming migrations.",
        whatCanGoWrong:
          "Lift and shift without optimization leading to higher cloud costs than on-premises. Underestimating application interdependencies. Missing data migration complexity. Inadequate testing before cutover.",
        howSecured:
          "Maintain security controls during migration. Use encrypted transfer. Validate IAM policies before cutover. Run parallel environments during transition. Use Checkov to scan migrated IaC configurations.",
        howUMGCTests:
          "CLCS 605 Unit 5 Assignment: Comprehensive Cloud Solution Design Project — create a cloud deployment plan for a small business application. Worth 150 points — the highest weighted assignment.",
        diagramSpec:
          "Migration wave diagram: horizontal timeline with Wave 1 (simple stateless apps, rehost), Wave 2 (stateful apps, replatform), Wave 3 (complex legacy, refactor or retire). Each wave shows assessment, migrate, validate, optimize phases.",
        relatedConcepts: ["cloud-architecture-principles", "cloud-deployment-models", "cost-optimization"],
        crossCourseLinks: [
          "CLCS 635: DevOps practices for migration automation",
          "CLCS 645: advanced cloud topics including migration patterns",
        ],
      },
    ],
  },

  /* ── Unit 6: Cloud Development and Deployment ── */
  {
    id: "unit-6",
    title: "Cloud Development and Deployment",
    slug: "cloud-development-and-deployment",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "cicd-pipelines-cloud",
        title: "CI/CD Pipelines in Cloud",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "A CI/CD pipeline is like a robot assembly line for software. Every time a developer writes new code, the robot automatically checks it, tests it, and if everything passes, puts it live without any human having to do each step manually.",
          intermediate:
            "Continuous Integration automatically builds and tests code on every commit. Continuous Delivery ensures code is always in a deployable state. Continuous Deployment automatically deploys to production after tests pass. Cloud-native CI/CD uses managed services — AWS CodePipeline, GitHub Actions, GitLab CI — integrated with cloud deployment targets.",
          advanced:
            "Peter already operates production CI/CD pipelines using ArgoCD for GitOps-based Kubernetes deployments. ArgoCD implements the pull-based deployment model — the cluster pulls desired state from Git rather than a pipeline pushing to it. This is more secure than push-based pipelines because the cluster never exposes an inbound attack surface. Security integration in CI/CD is shift-left security in practice: Trivy scans container images for CVEs, Gitleaks prevents secrets from entering the codebase, Checkov validates IaC security before deployment, SonarCloud performs static application security testing, OWASP ZAP runs dynamic application security testing against deployed applications. This is exactly what CLCS 605 Unit 6 covers.",
        },
        whatIsIt:
          "Automated pipelines that build, test, secure, and deploy software from code commit to production without manual intervention.",
        whyItMatters:
          "CI/CD enables the deployment velocity and reliability that cloud-native applications require. Manual deployments are too slow and error-prone for cloud operations.",
        howItWorks:
          "Developer commits code to Git. Pipeline triggers automatically. Code is built, unit tested, security scanned (Trivy, Gitleaks, Checkov, SonarCloud). Integration tests run. Container image is built and pushed to registry. ArgoCD detects image change and syncs deployment to Kubernetes cluster. OWASP ZAP runs against deployed application.",
        whereUsed:
          "Peter’s production pipelines. AWS CodePipeline for AWS-native CI/CD. GitHub Actions for cloud-agnostic pipelines. ArgoCD for GitOps Kubernetes deployments.",
        whatCanGoWrong:
          "Pipeline secrets exposed in logs. Skipping security scans to speed up pipelines. No rollback mechanism. Insufficient test coverage creating false confidence. Privileged service accounts with excessive permissions.",
        howSecured:
          "Secrets stored in AWS Secrets Manager or Vault never in pipeline environment variables. All security tools run as mandatory gates — builds fail on high-severity findings. Least privilege service accounts. Signed container images. Immutable image tags.",
        howUMGCTests:
          "CLCS 605 Unit 6 Quiz: Cloud Development and Deployment Concepts. Peter can draw directly from his production pipeline experience for all quiz and discussion questions in this unit.",
        diagramSpec:
          "Pipeline flow: Git Commit → Build → Trivy Scan → Gitleaks Scan → Checkov Scan → SonarCloud SAST → Unit Tests → Container Registry → ArgoCD Sync → Kubernetes Cluster → OWASP ZAP DAST → Production.",
        relatedConcepts: ["cloud-architecture-principles", "iam-and-access-control", "cloud-security-strategy"],
        crossCourseLinks: [
          "CLCS 635: full DevOps and automation course",
          "CTCH 625: threat analysis in deployment pipelines",
        ],
      },
    ],
  },

  /* ── Unit 7: Cloud Automation and Operations ── */
  {
    id: "unit-7",
    title: "Cloud Automation and Operations",
    slug: "cloud-automation-and-operations",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "cloud-monitoring-observability",
        title: "Cloud Monitoring and Observability",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Cloud monitoring is like having hundreds of sensors in your house that track temperature, power usage, and door activity all at once and send you an alert the moment something goes wrong.",
          intermediate:
            "Observability in cloud covers three pillars: metrics (numeric measurements over time), logs (timestamped event records), and traces (request flows across distributed services). AWS CloudWatch handles metrics and logs. AWS X-Ray provides distributed tracing. CloudWatch Alarms trigger automated responses. Dashboards provide operational visibility.",
          advanced:
            "Modern cloud observability goes beyond monitoring — it enables understanding of system behavior from external outputs. SRE practices use Service Level Indicators, Service Level Objectives, and Error Budgets to balance reliability with deployment velocity. In Peter’s Kubernetes environment, Prometheus and Grafana are the standard observability stack. EKS clusters expose metrics through the Kubernetes metrics server. Distributed tracing with X-Ray or OpenTelemetry tracks requests across microservices. CLCS 615 Unit 6 assignment directly tests monitoring strategy development — designing infrastructure that supports peak traffic with high availability and observability.",
        },
        whatIsIt:
          "The tools, practices, and architectures that provide visibility into cloud system health, performance, and security events.",
        whyItMatters:
          "You cannot secure or optimize what you cannot see. Monitoring is the prerequisite for incident response, cost optimization, and performance tuning.",
        howItWorks:
          "Agents or SDKs emit metrics, logs, and traces to centralized collection systems. Dashboards visualize data. Alerts fire when thresholds are crossed. Automated runbooks respond to common failure patterns. Log analysis identifies security incidents and performance regressions.",
        whereUsed:
          "CloudWatch for AWS infrastructure. Prometheus and Grafana for Kubernetes. AWS Security Hub aggregates security findings. CloudTrail provides audit logs for all API calls.",
        whatCanGoWrong:
          "Alert fatigue from too many low-priority alerts drowning critical ones. Missing logs from misconfigured log shipping. Monitoring only infrastructure without application metrics. No correlation between metrics logs and traces making root cause analysis difficult.",
        howSecured:
          "Centralized log storage in S3 with immutable object lock. CloudTrail in all regions. Security Hub for compliance monitoring. GuardDuty for threat detection. SIEM integration for security event correlation.",
        howUMGCTests:
          "CLCS 605 Unit 7 Assignment: Cloud Backup and Monitoring Plan. CLCS 615 Unit 6 Assignment: Cloud Monitoring Strategy Development. Both directly test monitoring design worth significant points.",
        diagramSpec:
          "Observability stack diagram: Applications and Infrastructure at bottom emitting Metrics, Logs, Traces upward. Three collection columns: CloudWatch (metrics/logs), X-Ray (traces), CloudTrail (audit). Convergence into Dashboard and Alerting layer at top.",
        relatedConcepts: ["cloud-architecture-principles", "cicd-pipelines-cloud", "disaster-recovery"],
        crossCourseLinks: [
          "CLCS 615 Unit 6: monitoring strategy development assignment",
          "CLCS 635: DevOps monitoring practices",
        ],
      },
    ],
  },

  /* ── Unit 8: Cloud Implementation and Operations ── */
  {
    id: "unit-8",
    title: "Cloud Implementation and Operations",
    slug: "cloud-implementation-and-operations",
    sourceType: "course-material-derived",
    concepts: [
      {
        id: "cloud-career-readiness",
        title: "Cloud Career Readiness",
        sourceType: "course-material-derived",
        depth: {
          eli10:
            "Cloud career readiness means being able to walk into a job on day one and actually do the work — not just talk about it. It means your certifications, projects, and real experience all line up with what employers need.",
          intermediate:
            "Cloud career paths include Cloud Architect, Cloud Engineer, DevOps Engineer, Cloud Security Engineer, and Cloud Operations roles. Certifications like AWS SAA, SAP, and SCS-C02 validate knowledge. Real project experience demonstrates application. Graduate education provides the strategic and governance thinking layer that certifications alone do not.",
          advanced:
            "Peter already operates at the intersection of cloud architecture, DevSecOps, and security — the highest-value profile in the current market. His AWS certifications (SAA-C03, SAP-C02, SCS-C02) combined with production EKS, ArgoCD, and security toolchain experience position him above most graduate students entering cloud careers. The CLCS program adds the academic framework, governance thinking, and communication skills that translate technical expertise into leadership capability. The Unit 8 Discussion asks Peter to reflect on his own readiness and perspective — he has more to draw from than any typical student in this course.",
        },
        whatIsIt:
          "The combination of technical skills, certifications, real-world experience, and professional communication ability that qualifies a cloud professional for advanced roles.",
        whyItMatters:
          "The cloud skills market is large but the top tier of professionals — those who combine architecture thinking, security depth, and operational experience — is small. That is the tier Peter is building toward.",
        howItWorks:
          "Technical skills are validated through certifications and demonstrated through projects. Strategic thinking is developed through graduate coursework and professional experience. Communication and leadership skills are developed through academic writing, peer collaboration, and professional engagement.",
        whereUsed:
          "Job interviews, promotion decisions, consulting proposals, and EB2-NIW extraordinary ability petitions — Peter’s long-term goal.",
        whatCanGoWrong:
          "Certifications without practical experience. Practical experience without strategic thinking framework. Technical depth without communication ability. Not documenting accomplishments as evidence.",
        howSecured:
          "Not applicable — this is a career concept not a security concept.",
        howUMGCTests:
          "CLCS 605 Unit 8 Discussion: Personal Growth in the Cloud — Reflecting on Your Readiness and Perspective. Peter should write this from a position of genuine strength drawing on two years of cloud study and production experience.",
        diagramSpec:
          "Career progression diagram: Foundation (certifications) → Application (production projects) → Strategy (graduate coursework) → Leadership (architecture decisions) → Recognition (EB2-NIW portfolio). Peter is currently at Application moving into Strategy.",
        relatedConcepts: ["cloud-architecture-principles", "cloud-security-strategy", "cicd-pipelines-cloud"],
        crossCourseLinks: [
          "CLCS 690 Capstone: demonstrates full program mastery",
          "All courses: build EB2-NIW portfolio evidence",
        ],
      },
    ],
  },
];

/* ── CLCS 605 course (program hierarchy) ── */

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
    "Analyze organizational infrastructure needs and align with appropriate cloud computing strategies.",
    "Evaluate IaaS, PaaS, SaaS service models and public, private, hybrid deployment configurations.",
    "Assess cloud security risks and employ IAM, data protection, and network security controls.",
    "Plan scalable and cost-optimized cloud infrastructure using architecture principles and serverless patterns.",
    "Explain cloud development, deployment, integration, migration, and post-deployment operations.",
    "Explain cloud automation, orchestration, monitoring, backup, and disaster recovery solutions.",
  ],
  cyberOverlap: [
    "Connects cloud shared responsibility to cybersecurity ownership and control accountability.",
    "Introduces IAM and data protection concepts that later recur in CTCH security courses.",
  ],
  topics: clcs605DeepTopics.map((ut) =>
    buildTopic({
      slug: ut.slug,
      title: ut.title,
      description: ut.concepts.map((c) => c.whatIsIt).join(" "),
      umgcWeek: `Week ${ut.id.replace("unit-", "")}`,
      sourceType: "syllabus-derived",
      assessmentRelevance: ut.concepts.map((c) => c.howUMGCTests).join(" "),
      concepts: ut.concepts.map(deepToBaseConcept),
    }),
  ),
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

/* ── Deep concept lookup helpers ── */

export function getConceptsForUnit(
  courseCode: string,
  unitSlug: string,
): Concept[] {
  if (courseCode === "CLCS 605") {
    const topic = clcs605DeepTopics.find((t) => t.slug === unitSlug);
    return topic?.concepts ?? [];
  }
  return [];
}

export function getConceptsForUnitNumber(
  courseCode: string,
  unitNumber: number,
): Concept[] {
  if (courseCode === "CLCS 605" && unitNumber >= 1 && unitNumber <= clcs605DeepTopics.length) {
    return clcs605DeepTopics[unitNumber - 1].concepts;
  }
  return [];
}
