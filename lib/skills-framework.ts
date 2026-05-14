export type SkillLevel = "end-of-program" | "end-of-course";

export type Skill = {
  id: string;
  title: string;
  level: SkillLevel;
  courseCode: string;
  industryConnection: string;
  skillStatement: string;
  assessedIn: string[];
  careerRelevance: string;
};

export type CourseSkillProfile = {
  courseCode: string;
  courseName: string;
  endOfProgramSkills: Skill[];
  endOfCourseSkills: Skill[];
  careerCompetencies: string[];
  industryContext: string;
  readinessStatement: string;
};

export const CLCS615_SKILL_PROFILE: CourseSkillProfile = {
  courseCode: "CLCS 615",
  courseName: "Cloud Services and Technologies",
  industryContext:
    "According to McKinsey and Company, worldwide cloud adoption could generate 3 trillion dollars in global value by 2030. Major companies like Airbnb, Spotify, and WhatsApp have built billion-dollar businesses on cloud foundations. Organizations leveraging cloud services can launch new products faster, scale operations globally, and respond to market changes with unprecedented speed.",
  readinessStatement:
    "You already possess many foundational skills needed to succeed in this course. Your analytical abilities, problem-solving skills, and basic technology knowledge provide a strong foundation. For Peter specifically — AWS certifications and production DevSecOps experience mean you are entering this course ahead of most students.",
  careerCompetencies: [
    "Cloud Architecture Proficiency — Design scalable, secure, high-availability cloud systems",
    "Infrastructure Optimization — Balance cost-efficiency with performance requirements",
    "Strategic Decision-Making — Align cloud choices with organizational business objectives",
    "Security Implementation — Apply governance and compliance best practices",
    "Performance Monitoring — Maintain peak system performance while controlling costs",
    "Technology Leadership — Lead digital transformation initiatives from day one",
  ],
  endOfProgramSkills: [
    {
      id: "clcs615-eps-1",
      title: "Organizational Infrastructure Alignment",
      level: "end-of-program",
      courseCode: "CLCS 615",
      industryConnection:
        "Cloud Architect, Solutions Architect, IT Strategy roles require ability to assess organizational needs and recommend appropriate cloud strategies.",
      skillStatement:
        "Employ cloud services and technologies that align with organizational infrastructure needs and appropriate cloud computing strategies to enhance business efficiency and agility. In CLCS 615 this means evaluating real organizational scenarios and recommending specific AWS, Azure, or GCP service configurations justified by business requirements.",
      assessedIn: [
        "Unit 1 Assignment: Cloud Service Model Analysis",
        "Unit 3 Assignment: Comprehensive Cloud Strategy Development",
        "Unit 3 Discussion: Recommendations for Cloud Implementation",
      ],
      careerRelevance:
        "Every cloud architect role requires the ability to translate business requirements into technical architecture decisions. This skill is the foundation of consulting and senior engineering work.",
    },
    {
      id: "clcs615-eps-2",
      title: "Cloud Service Configuration and Optimization",
      level: "end-of-program",
      courseCode: "CLCS 615",
      industryConnection:
        "Cloud Engineers and DevOps Engineers are evaluated on ability to assess service options and recommend optimal configurations.",
      skillStatement:
        "Assess various cloud computing services and technologies and recommend the most suitable configuration based on performance, cost-efficiency, and alignment with organizational needs. In CLCS 615 this means comparing service tiers, pricing models, and performance characteristics to make evidence-based recommendations.",
      assessedIn: [
        "Unit 2 Assignment: Evaluating Cloud SLAs for Business-Critical Applications",
        "Unit 6 Assignment: Cloud Monitoring Strategy Development",
        "Unit 7 Assignment: Balancing Cost and Performance in Cloud Design",
      ],
      careerRelevance:
        "Cost optimization and right-sizing are among the highest-value skills in cloud operations. Organizations consistently overspend on cloud — engineers who can optimize earn premium salaries.",
    },
    {
      id: "clcs615-eps-3",
      title: "Robust Cloud Infrastructure Design",
      level: "end-of-program",
      courseCode: "CLCS 615",
      industryConnection:
        "Cloud Architects and Senior Engineers design infrastructure that supports organizational needs with high availability, scalability, and security.",
      skillStatement:
        "Design robust cloud infrastructure solutions that support organizational needs and ensure high availability, scalability, and security. In CLCS 615 this means applying architecture patterns like multi-AZ deployment, auto-scaling, and defense in depth to realistic business scenarios.",
      assessedIn: [
        "Unit 4 Assignment: Comprehensive Cloud Strategy Development",
        "Unit 5 Assignment: Cloud Infrastructure Design and Implementation Project",
        "Unit 5 Discussion: Choose Your Own Cloud Infrastructure Scenario",
      ],
      careerRelevance:
        "Infrastructure design is the core deliverable of cloud architecture roles. Peter's EKS and multi-AZ production experience directly maps to this skill.",
    },
    {
      id: "clcs615-eps-4",
      title: "Cloud Performance and Scalability Evaluation",
      level: "end-of-program",
      courseCode: "CLCS 615",
      industryConnection:
        "SRE, Platform Engineering, and Cloud Operations roles require continuous evaluation and optimization of cloud performance.",
      skillStatement:
        "Evaluate cloud service performance and scalability requirements applying cloud design principles to create robust resilient and cost-optimized cloud solutions tailored to organizational goals. In CLCS 615 this means analyzing performance metrics, identifying bottlenecks, and designing solutions that maintain SLAs under variable load.",
      assessedIn: [
        "Unit 6 Assignment: Cloud Monitoring Strategy Development",
        "Unit 6 Quiz: Cloud Performance Metrics and Optimization",
        "Unit 8 Discussion: Cloud Resilience Strategies",
      ],
      careerRelevance:
        "Performance engineering and SRE practices are among the fastest growing specializations in cloud. Understanding SLIs, SLOs, and error budgets is essential for senior roles.",
    },
  ],
  endOfCourseSkills: [
    {
      id: "clcs615-ecs-1",
      title: "Cloud Service Model Analysis from Security Perspective",
      level: "end-of-course",
      courseCode: "CLCS 615",
      industryConnection:
        "Cybersecurity professionals must understand IaaS, PaaS, SaaS responsibility boundaries to design appropriate security controls.",
      skillStatement:
        "Evaluate IaaS, PaaS, and SaaS service models from the perspective of a cybersecurity professional, analyzing how each model shifts security responsibility between provider and consumer.",
      assessedIn: ["Unit 1 Assignment: Cloud Service Model Analysis"],
      careerRelevance:
        "Peter's SCS-C02 certification background makes this a strength area. The academic framing adds strategic depth to existing technical knowledge.",
    },
    {
      id: "clcs615-ecs-2",
      title: "Governance-Focused Cloud Strategy Development",
      level: "end-of-course",
      courseCode: "CLCS 615",
      industryConnection:
        "Cloud Consultants and Architects in regulated industries must design strategies that satisfy compliance requirements while enabling business agility.",
      skillStatement:
        "Develop comprehensive governance-focused cloud strategies that address complex requirements of regulated organizations demonstrating strategic thinking about deployment models, SLAs, and organizational readiness.",
      assessedIn: [
        "Unit 3 Assignment: Comprehensive Cloud Strategy Development",
        "Unit 4 Assignment: Comprehensive Cloud Strategy Development",
      ],
      careerRelevance:
        "Healthcare, finance, and government cloud projects require governance expertise. This is a premium skill commanding higher consulting rates.",
    },
    {
      id: "clcs615-ecs-3",
      title: "SLA Evaluation and Business Continuity Planning",
      level: "end-of-course",
      courseCode: "CLCS 615",
      industryConnection:
        "Every enterprise cloud deployment requires SLA analysis to ensure business-critical applications meet availability and recovery requirements.",
      skillStatement:
        "Evaluate cloud SLAs for business-critical applications and design monitoring strategies that ensure compliance with availability commitments.",
      assessedIn: [
        "Unit 2 Assignment: Evaluating Cloud SLAs for Business-Critical Applications",
        "Unit 6 Assignment: Cloud Monitoring Strategy Development",
      ],
      careerRelevance:
        "SLA design and monitoring are core responsibilities of cloud operations teams. Understanding uptime mathematics and recovery objectives is essential.",
    },
    {
      id: "clcs615-ecs-4",
      title: "Cost and Performance Optimization",
      level: "end-of-course",
      courseCode: "CLCS 615",
      industryConnection:
        "FinOps practitioners and Cloud Engineers who can balance cost and performance are consistently in high demand.",
      skillStatement:
        "Design cloud solutions that balance cost optimization with performance requirements using right-sizing, reserved capacity, auto-scaling, and monitoring frameworks.",
      assessedIn: [
        "Unit 7 Assignment: Balancing Cost and Performance in Cloud Design",
        "Unit 2 Quiz: Cloud Cost Optimization and Performance Assessment",
      ],
      careerRelevance:
        "Cloud cost optimization is one of the top priorities for every CTO. Engineers who deliver measurable cost savings advance faster.",
    },
    {
      id: "clcs615-ecs-5",
      title: "Cloud Resilience and Governance",
      level: "end-of-course",
      courseCode: "CLCS 615",
      industryConnection:
        "Senior cloud professionals design systems that survive failures gracefully and comply with governance requirements continuously.",
      skillStatement:
        "Design cloud resilience strategies and governance frameworks that ensure business continuity while maintaining compliance and operational flexibility.",
      assessedIn: [
        "Unit 8 Discussion: Cloud Resilience Strategies",
        "Unit 6 Assignment: Cloud Monitoring Strategy Development",
      ],
      careerRelevance:
        "Resilience engineering and governance are leadership-level skills that distinguish architects from engineers.",
    },
  ],
};

export const CLCS605_SKILL_PROFILE: CourseSkillProfile = {
  courseCode: "CLCS 605",
  courseName: "Introduction to Cloud Computing",
  industryContext:
    "Cloud computing is the foundational technology of the modern digital economy. Every organization from startups to governments now depends on cloud infrastructure. AWS alone generates over 90 billion dollars annually. The professionals who understand cloud deeply — not just operationally but strategically and architecturally — are among the most valued in technology.",
  readinessStatement:
    "Peter enters CLCS 605 with AWS SAA-C03, SAP-C02, and SCS-C02 certifications plus production experience with EKS, ArgoCD, Trivy, Gitleaks, Checkov, SonarCloud, and OWASP ZAP. This course provides the academic framework that elevates technical expertise into strategic and architectural thinking.",
  careerCompetencies: [
    "Cloud Strategy Alignment — Match organizational needs to appropriate cloud strategies",
    "Service Model Evaluation — Recommend IaaS, PaaS, SaaS configurations for specific use cases",
    "Security Risk Assessment — Design IAM, data protection, and network security controls",
    "Architecture Planning — Design scalable cost-optimized cloud infrastructure",
    "Deployment Strategy — Explain cloud development, migration, and operations approaches",
    "Automation Design — Explain cloud automation, monitoring, backup, and disaster recovery",
  ],
  endOfProgramSkills: [
    {
      id: "clcs605-eps-1",
      title: "Organizational Infrastructure Analysis",
      level: "end-of-program",
      courseCode: "CLCS 605",
      industryConnection:
        "Cloud Architects and Solutions Engineers analyze organizational infrastructure needs as the first step in every cloud engagement.",
      skillStatement:
        "Analyze organizational infrastructure needs and align them with appropriate cloud computing strategies to enhance business efficiency and agility.",
      assessedIn: [
        "Unit 1 Discussion: Cloud Computing Transformation",
        "Unit 5 Assignment: Comprehensive Cloud Solution Design Project",
      ],
      careerRelevance:
        "Requirements analysis and strategy alignment are the highest-leverage skills in cloud consulting. Every engagement starts here.",
    },
    {
      id: "clcs605-eps-2",
      title: "Cloud Model Evaluation and Recommendation",
      level: "end-of-program",
      courseCode: "CLCS 605",
      industryConnection:
        "Cloud professionals must evaluate service and deployment models against organizational requirements and recommend optimal configurations.",
      skillStatement:
        "Evaluate IaaS, PaaS, SaaS service models and public, private, hybrid deployment configurations to recommend optimal solutions based on organizational requirements.",
      assessedIn: [
        "Unit 1 Quiz: MARS/Aloft Setup",
        "Unit 3 Quiz: Comprehensive Cloud Knowledge Assessment",
        "Unit 5 Assignment: Comprehensive Cloud Solution Design Project",
      ],
      careerRelevance:
        "Service model and deployment model selection decisions have multi-year cost and security implications. Getting them right is a core architect competency.",
    },
    {
      id: "clcs605-eps-3",
      title: "Cloud Security Risk Assessment",
      level: "end-of-program",
      courseCode: "CLCS 605",
      industryConnection:
        "Cloud Security Engineers assess risks and design IAM, data protection, and network security controls as core job responsibilities.",
      skillStatement:
        "Assess cloud security risks and employ robust cloud data security, IAM, and network security controls to mitigate vulnerabilities and ensure secure cloud environments.",
      assessedIn: [
        "Unit 2 Assignment: Cloud IAM and Data Security Design",
        "Unit 3 Quiz: Comprehensive Cloud Knowledge Assessment",
      ],
      careerRelevance:
        "Peter's SCS-C02 certification and production security toolchain make this a strength. The academic framework adds governance and compliance depth.",
    },
  ],
  endOfCourseSkills: [
    {
      id: "clcs605-ecs-1",
      title: "Cloud Architecture Planning",
      level: "end-of-course",
      courseCode: "CLCS 605",
      industryConnection:
        "Cloud Architects plan scalable and cost-optimized infrastructure as the foundation of every cloud deployment.",
      skillStatement:
        "Plan scalable and cost-optimized cloud infrastructure solutions applying architecture principles including serverless architectures and cloud service performance considerations.",
      assessedIn: ["Unit 4 Assignment: Cloud Cost Optimization Plan"],
      careerRelevance:
        "Cost optimization architecture is one of the highest-ROI skills in cloud. Organizations consistently overspend — architects who optimize save millions.",
    },
    {
      id: "clcs605-ecs-2",
      title: "Cloud Development and Deployment Strategy",
      level: "end-of-course",
      courseCode: "CLCS 605",
      industryConnection:
        "DevOps Engineers and Cloud Engineers design and implement deployment strategies that ensure reliable cloud operations.",
      skillStatement:
        "Explain cloud development and deployment strategies through integration and migration of cloud services ensuring seamless cloud operations and maintenance post-deployment.",
      assessedIn: [
        "Unit 6 Quiz: Cloud Development and Deployment Concepts",
        "Unit 5 Assignment: Comprehensive Cloud Solution Design Project",
      ],
      careerRelevance:
        "Peter's ArgoCD and CI/CD pipeline experience maps directly to this skill. The academic layer adds migration strategy and enterprise deployment thinking.",
    },
    {
      id: "clcs605-ecs-3",
      title: "Cloud Automation and Operations",
      level: "end-of-course",
      courseCode: "CLCS 605",
      industryConnection:
        "Cloud Operations Engineers design automation frameworks for monitoring, backup, and disaster recovery.",
      skillStatement:
        "Explain the benefits of cloud automation and orchestration solutions for monitoring, backups, and disaster recovery.",
      assessedIn: ["Unit 7 Assignment: Cloud Backup and Monitoring Plan"],
      careerRelevance:
        "Automation engineering is the foundation of SRE and platform engineering roles. Organizations that automate operations scale without proportionally scaling headcount.",
    },
  ],
};

export const ALL_SKILL_PROFILES = [CLCS605_SKILL_PROFILE, CLCS615_SKILL_PROFILE];

export function getSkillProfileByCourseCode(courseCode: string): CourseSkillProfile | null {
  return ALL_SKILL_PROFILES.find((profile) => profile.courseCode === courseCode) ?? null;
}
