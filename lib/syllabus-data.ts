export type SyllabusAssignmentType = "discussion" | "assignment" | "quiz";

export type SyllabusRubric = Record<string, number>;

export type SyllabusAssignment = {
  id: string;
  title: string;
  type: SyllabusAssignmentType;
  points: number;
  dueDate: string;
  description?: string;
  rubric?: SyllabusRubric;
  requiredWordCount?: string;
  citations?: string;
};

export type SyllabusUnit = {
  unit: number;
  topic: string;
  subtopics: string[];
  assignments: SyllabusAssignment[];
};

export type SyllabusCourse = {
  slug: string;
  code: string;
  name: string;
  instructorName: string;
  instructorEmail: string;
  startDate: string;
  endDate: string;
  credits: number;
  grading: {
    discussions: number;
    assignments: number;
    quizzes: number;
    total: number;
  };
  minimumPassingGrade?: number;
  units: SyllabusUnit[];
  keyResources?: string[];
};

export const COURSE_START_DATE = "2026-05-13";
export const COURSE_END_DATE = "2026-07-07";
export const GRADUATE_MIN_GRADE = 80;

export const KEY_RESOURCES = [
  "Erl & Monroy (2023) Cloud Computing: Concepts, Technology, Security and Architecture 2nd ed — Chapters 3-18",
  "NIST SP 800-145: Definition of Cloud Computing",
  "ISO/IEC 22123-1:2023 Cloud Computing Vocabulary",
  "AWS IAM Documentation",
  "Azure RBAC and ABAC Documentation",
  "Google Cloud IAM Overview",
  "McKinsey Cloud Value Report",
  "AWS vs Azure vs GCP Comparison Video",
] satisfies string[];

export const CLCS605_UNITS = [
  {
    unit: 1,
    topic: "Fundamentals of Cloud Computing",
    subtopics: [
      "History of Cloud Computing",
      "NIST & ISO Definitions of Cloud Computing",
      "Essential Characteristics: On-demand self-service, Broad network access, Resource pooling, Rapid elasticity, Measured service",
      "Cloud Adoption Frameworks",
      "Virtualization and Computer Architecture",
      "Cloud Service Models: IaaS, PaaS, SaaS",
      "Cloud Deployment Models: Public, Private, Hybrid, Community, Multi-cloud",
      "Process and Requirements Analysis for Cloud Implementation",
      "Hardware/Software Integration and Architecture Best Practices",
    ],
    assignments: [
      {
        id: "clcs605-u1-discussion",
        title: "Unit 1 Discussion: Cloud Computing Transformation",
        type: "discussion",
        points: 75,
        dueDate: "Initial post: Sunday 11:59 PM ET | Peer responses: Tuesday 11:59 PM ET",
        description:
          "Analyze how cloud computing transformation impacts organizational capabilities. Part 1 (300-400 words): Describe transformation opportunity for a traditional on-premises organization, analyze all 5 NIST essential characteristics and their interactions, identify transformation challenges. Part 2: Address impact on IT Operations, Business Operations, Financial Management, Strategic Planning. Part 3: 2 peer responses (150-200 words each).",
        rubric: {
          collaborativeLearning: 20,
          evidenceOfSkillDevelopment: 20,
          engagementAndRespect: 20,
          initiative: 5,
          communicationAndWriting: 10,
          total: 75,
        },
        requiredWordCount: "300-400 words initial post, 150-200 words per peer response",
        citations: "APA format required",
      },
      {
        id: "clcs605-u1-quiz",
        title: "Unit 1 Quiz: MARS/Aloft Setup",
        type: "quiz",
        points: 0,
        dueDate: "Tuesday 11:59 PM ET",
        description: "MARS virtual lab environment setup quiz",
      },
    ],
  },
  {
    unit: 2,
    topic: "Cloud Security and Compliance",
    subtopics: [
      "Identity and Access Management (IAM)",
      "Cloud Data Security",
      "Network Security Controls",
      "Cloud Compliance Frameworks",
      "Security Risk Assessment",
      "Zero Trust Architecture",
      "Encryption in the Cloud",
      "Security Policies and Governance",
    ],
    assignments: [
      {
        id: "clcs605-u2-assignment",
        title: "Unit 2 Assignment: Cloud IAM and Data Security Design",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "Implement basic IAM controls and data security measures for a cloud environment by selecting appropriate options from a provided template and business scenario.",
      },
    ],
  },
  {
    unit: 3,
    topic: "Cloud Strategy and Security Implementation",
    subtopics: [
      "Cloud Security Strategy",
      "Security Implementation Frameworks",
      "Risk Management in Cloud",
      "Compliance and Regulatory Requirements",
      "Security Architecture Design",
      "Incident Response Planning",
    ],
    assignments: [
      {
        id: "clcs605-u3-quiz",
        title: "Unit 3 Quiz: Comprehensive Cloud Knowledge Assessment",
        type: "quiz",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
      },
    ],
  },
  {
    unit: 4,
    topic: "Cloud Architecture and Design",
    subtopics: [
      "Cloud Architecture Principles",
      "Serverless Architectures",
      "Microservices Design",
      "High Availability and Fault Tolerance",
      "Scalability Patterns",
      "Cost Optimization Architecture",
      "Well-Architected Framework",
    ],
    assignments: [
      {
        id: "clcs605-u4-assignment",
        title: "Unit 4 Assignment: Cloud Cost Optimization Plan",
        type: "assignment",
        points: 125,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "Develop a cost optimization plan including analysis of current resource utilization, recommended optimization strategies, implementation planning, and performance monitoring frameworks.",
      },
    ],
  },
  {
    unit: 5,
    topic: "Cloud Design and Implementation Strategies",
    subtopics: [
      "Cloud Migration Strategies",
      "Lift and Shift vs Re-architecture",
      "Cloud Deployment Planning",
      "Integration Strategies",
      "Performance Optimization",
      "Implementation Best Practices",
    ],
    assignments: [
      {
        id: "clcs605-u5-assignment",
        title: "Unit 5 Assignment: Comprehensive Cloud Solution Design Project",
        type: "assignment",
        points: 150,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "Combine cloud planning, design, and implementation strategies to create a simple cloud deployment plan for a small business application.",
      },
    ],
  },
  {
    unit: 6,
    topic: "Cloud Development and Deployment",
    subtopics: [
      "CI/CD Pipelines in Cloud",
      "DevOps and Cloud Integration",
      "Container Orchestration",
      "Cloud-Native Development",
      "API Management",
      "Infrastructure as Code",
    ],
    assignments: [
      {
        id: "clcs605-u6-quiz",
        title: "Unit 6 Quiz: Cloud Development and Deployment Concepts",
        type: "quiz",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
      },
    ],
  },
  {
    unit: 7,
    topic: "Cloud Automation and Operations",
    subtopics: [
      "Cloud Automation Tools",
      "Orchestration Frameworks",
      "Monitoring and Observability",
      "Backup and Disaster Recovery",
      "Operations Management",
      "SRE Practices",
    ],
    assignments: [
      {
        id: "clcs605-u7-assignment",
        title: "Unit 7 Assignment: Cloud Backup and Monitoring Plan",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "Design comprehensive backup strategies and monitoring frameworks ensuring business continuity while optimizing operational costs and performance.",
      },
    ],
  },
  {
    unit: 8,
    topic: "Cloud Implementation and Operations",
    subtopics: [
      "Advanced Cloud Operations",
      "Future of Cloud Computing",
      "Professional Development in Cloud",
      "Career Readiness",
      "Industry Certifications Path",
    ],
    assignments: [
      {
        id: "clcs605-u8-discussion",
        title: "Unit 8 Discussion: Personal Growth in the Cloud",
        type: "discussion",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
        description: "Reflecting on Your Readiness and Perspective",
      },
      {
        id: "clcs605-u8-quiz",
        title: "Unit 8 Quiz: Comprehensive Cloud Implementation and Operations",
        type: "quiz",
        points: 200,
        dueDate: "Check UMGC classroom for exact date",
      },
    ],
  },
] satisfies SyllabusUnit[];

export const CLCS615_UNITS = [
  {
    unit: 1,
    topic: "Introduction to Cloud Services and Technologies",
    subtopics: [
      "Cloud Computing Fundamentals Review",
      "IaaS, PaaS, SaaS from a Cybersecurity Perspective",
      "Cloud Governance Overview",
      "Organizational Infrastructure Alignment",
      "Cloud Provider Comparison: AWS vs Azure vs GCP",
      "Cloud Adoption Decision Framework",
      "Business Case for Cloud Migration",
    ],
    assignments: [
      {
        id: "clcs615-u1-quiz",
        title: "Unit 1 Quiz: Cloud Computing Fundamentals",
        type: "quiz",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "10 scenario-based multiple choice questions on cloud fundamentals, service models, deployment models, governance implications.",
      },
      {
        id: "clcs615-u1-assignment",
        title: "Unit 1 Assignment: Cloud Service Model Analysis",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "Evaluate major cloud service models (IaaS, PaaS, SaaS) from the perspective of a cybersecurity professional.",
      },
    ],
  },
  {
    unit: 2,
    topic: "Cloud Computing Technologies and Infrastructure",
    subtopics: [
      "Cloud Storage Technologies",
      "Cloud Networking",
      "Cloud Databases",
      "Containerization Technologies",
      "Cost Optimization Strategies",
      "Performance Assessment",
      "Service Level Agreements (SLAs)",
      "SLA Evaluation for Business-Critical Applications",
    ],
    assignments: [
      {
        id: "clcs615-u2-quiz",
        title: "Unit 2 Quiz: Cloud Cost Optimization and Performance Assessment",
        type: "quiz",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
      },
      {
        id: "clcs615-u2-assignment",
        title: "Unit 2 Assignment: Evaluating Cloud SLAs for Business-Critical Applications",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
        description: "Evaluate cloud SLAs for business-critical applications.",
      },
    ],
  },
  {
    unit: 3,
    topic: "Cloud Strategy and Organizational Alignment",
    subtopics: [
      "Cloud Strategy Development",
      "Governance-Focused Cloud Planning",
      "Healthcare Cloud Compliance (HIPAA)",
      "Regulated Industry Cloud Requirements",
      "Organizational Change Management",
      "Cloud Readiness Assessment",
      "Stakeholder Communication",
    ],
    assignments: [
      {
        id: "clcs615-u3-discussion",
        title: "Unit 3 Discussion: Recommendations for Cloud Implementation",
        type: "discussion",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
      },
      {
        id: "clcs615-u3-assignment",
        title: "Unit 3 Assignment: Comprehensive Cloud Strategy Development",
        type: "assignment",
        points: 125,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "Develop a comprehensive governance-focused cloud strategy for a regulated healthcare organization addressing deployment models, SLAs, and organizational readiness.",
      },
    ],
  },
  {
    unit: 4,
    topic: "Cloud Architecture and Design Principles",
    subtopics: [
      "Cloud Security Architecture",
      "Zero Trust in Cloud",
      "Identity-Centric Security",
      "Network Security Design",
      "Data Protection Architecture",
      "Resilient Architecture Patterns",
      "Multi-Region Design",
    ],
    assignments: [
      {
        id: "clcs615-u4-quiz",
        title: "Unit 4 Quiz: Cloud Security Architecture and Best Practices",
        type: "quiz",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
      },
      {
        id: "clcs615-u4-assignment",
        title: "Unit 4 Assignment: Comprehensive Cloud Strategy Development",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
      },
    ],
  },
  {
    unit: 5,
    topic: "Cloud Infrastructure Implementation and Security",
    subtopics: [
      "Implementation Planning",
      "Security Hardening",
      "Network Segmentation",
      "Access Control Implementation",
      "Encryption Implementation",
      "Security Testing",
      "Compliance Verification",
    ],
    assignments: [
      {
        id: "clcs615-u5-discussion",
        title: "Unit 5 Discussion: Choose Your Own Cloud Infrastructure Scenario",
        type: "discussion",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
      },
      {
        id: "clcs615-u5-assignment",
        title: "Unit 5 Assignment: Comprehensive Cloud Infrastructure Design and Implementation Project",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
        description: "Create a cloud deployment plan for a small business application.",
      },
    ],
  },
  {
    unit: 6,
    topic: "Cloud Performance Monitoring and Optimization",
    subtopics: [
      "Monitoring Strategy Development",
      "Observability Frameworks",
      "Performance Metrics",
      "Cost vs Performance Trade-offs",
      "Auto-scaling Strategies",
      "Traffic Management",
      "High Availability Design",
    ],
    assignments: [
      {
        id: "clcs615-u6-assignment",
        title: "Unit 6 Assignment: Cloud Monitoring Strategy Development",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
        description:
          "Evaluate existing cloud setup and propose robust infrastructure design supporting peak traffic, enhanced performance, and cost optimization with high availability.",
      },
      {
        id: "clcs615-u6-quiz",
        title: "Unit 6 Quiz: Cloud Performance Metrics and Optimization",
        type: "quiz",
        points: 75,
        dueDate: "Check UMGC classroom for exact date",
      },
    ],
  },
  {
    unit: 7,
    topic: "Cloud Cost Optimization and Scalability",
    subtopics: [
      "Cost Management Frameworks",
      "Reserved vs On-Demand Pricing",
      "Spot Instance Strategies",
      "Auto-scaling Design",
      "Cost Allocation and Tagging",
      "FinOps Practices",
      "Balancing Cost and Performance",
    ],
    assignments: [
      {
        id: "clcs615-u7-assignment",
        title: "Unit 7 Assignment: Balancing Cost and Performance in Cloud Design",
        type: "assignment",
        points: 100,
        dueDate: "Check UMGC classroom for exact date",
      },
    ],
  },
  {
    unit: 8,
    topic: "Cloud Resilience, Governance, and Future Trends",
    subtopics: [
      "Business Continuity Planning",
      "Disaster Recovery Design",
      "Cloud Governance Frameworks",
      "Future Cloud Technologies",
      "AI and ML in Cloud",
      "Edge Computing",
      "Quantum Computing Implications",
    ],
    assignments: [
      {
        id: "clcs615-u8-discussion",
        title: "Unit 8 Discussion: Cloud Resilience Strategies",
        type: "discussion",
        points: 50,
        dueDate: "Check UMGC classroom for exact date",
      },
    ],
  },
] satisfies SyllabusUnit[];

export const CLCS605_COURSE = {
  slug: "clcs-605-introduction-to-cloud-computing",
  code: "CLCS 605",
  name: "Introduction to Cloud Computing",
  instructorName: "Anthony Ayodele",
  instructorEmail: "anthony.ayodele@faculty.umgc.edu",
  startDate: COURSE_START_DATE,
  endDate: COURSE_END_DATE,
  credits: 3,
  grading: {
    discussions: 175,
    assignments: 475,
    quizzes: 350,
    total: 1000,
  },
  minimumPassingGrade: GRADUATE_MIN_GRADE,
  units: CLCS605_UNITS,
} satisfies SyllabusCourse;

export const CLCS615_COURSE = {
  slug: "clcs-615-cloud-services-and-technologies",
  code: "CLCS 615",
  name: "Cloud Services and Technologies",
  instructorName: "Mohammad Espahrom",
  instructorEmail: "mohammad.espahrom@faculty.umgc.edu",
  startDate: COURSE_START_DATE,
  endDate: COURSE_END_DATE,
  credits: 3,
  grading: {
    discussions: 200,
    assignments: 425,
    quizzes: 375,
    total: 1000,
  },
  units: CLCS615_UNITS,
  keyResources: KEY_RESOURCES,
} satisfies SyllabusCourse;

export const ACTIVE_SYLLABUS_COURSES = [CLCS605_COURSE, CLCS615_COURSE] satisfies SyllabusCourse[];

export function getSyllabusCourseBySlug(courseSlug: string) {
  return ACTIVE_SYLLABUS_COURSES.find((course) => course.slug === courseSlug);
}

export function getSyllabusCourseByCode(courseCode: string) {
  return ACTIVE_SYLLABUS_COURSES.find((course) => course.code === courseCode);
}

export function getSyllabusUnit(courseSlug: string, unitNumber: number) {
  return getSyllabusCourseBySlug(courseSlug)?.units.find((unit) => unit.unit === unitNumber);
}

export function getUnitPointsTotal(unit: SyllabusUnit) {
  return unit.assignments.reduce((total, assignment) => total + assignment.points, 0);
}

export function getCourseAssignments(course: SyllabusCourse) {
  return course.units.flatMap((unit) => unit.assignments);
}

export function parseWordCountMinimum(wordCount?: string) {
  if (!wordCount) {
    return null;
  }

  const match = wordCount.match(/\d+/);
  return match ? Number(match[0]) : null;
}

export function getUnitWeekDateRange(unitNumber: number) {
  const start = new Date(`${COURSE_START_DATE}T00:00:00`);
  const end = new Date(`${COURSE_END_DATE}T00:00:00`);
  const unitStart = new Date(start);
  unitStart.setDate(start.getDate() + (unitNumber - 1) * 7);
  const unitEnd = new Date(unitStart);
  unitEnd.setDate(unitStart.getDate() + 6);

  if (unitEnd > end) {
    return { start: unitStart, end };
  }

  return { start: unitStart, end: unitEnd };
}

export function formatUnitWeekLabel(unitNumber: number) {
  const { start, end } = getUnitWeekDateRange(unitNumber);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  return `Week ${unitNumber} · ${formatter.format(start)} - ${formatter.format(end)}`;
}
