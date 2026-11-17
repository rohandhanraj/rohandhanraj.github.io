import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RetrievalResult {
  context: string;
  retrievalLog: string;
  matchedNodesCount: number;
}

interface YearsExperience {
  total: number;
  ai_ml: number;
  generative_ai: number;
  agentic_ai: number;
}

interface ExperienceItem {
  company: string;
  client?: string;
  title: string;
  start_date: string;
  end_date: string;
  location: string;
  responsibilities: string[];
  skills_used: string[];
}

interface ProjectItem {
  name: string;
  domain: string;
  description: string;
  skills_used: string[];
  responsibilities: string[];
}

interface EducationItem {
  degree?: string;
  institution?: string;
  year?: string;
  details?: string;
  title?: string;
  discipline?: string;
  issuer?: string;
  credential_id?: string;
}

interface CertificationItem {
  name: string;
  issuer: string;
  credential_id?: string;
  achievement?: string;
}

export interface ProfessionalFacts {
  full_name: string;
  name: string;
  current_role: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  portfolio: string;
  years_experience: YearsExperience;
  specialties: Record<string, string[]>;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

let cachedFacts: ProfessionalFacts | null = null;

export function loadProfessionalFacts(): ProfessionalFacts {
  if (cachedFacts) return cachedFacts;

  const candidatePaths = [
    path.resolve(__dirname, "../data/professionalFacts.json"),
    path.resolve(__dirname, "../../src/data/professionalFacts.json"),
    path.resolve(__dirname, "../../../src/data/professionalFacts.json"),
    path.resolve(process.cwd(), "src/data/professionalFacts.json"),
    path.resolve(process.cwd(), "backend/src/data/professionalFacts.json"),
    path.resolve(process.cwd(), "data/professionalFacts.json")
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const content = fs.readFileSync(candidate, "utf-8");
        cachedFacts = JSON.parse(content) as ProfessionalFacts;
        return cachedFacts;
      }
    } catch {
      // Continue checking remaining candidates
    }
  }

  // Fallback to URL-based resolution
  try {
    const factsUrl = new URL("../data/professionalFacts.json", import.meta.url);
    const content = fs.readFileSync(factsUrl, "utf-8");
    cachedFacts = JSON.parse(content) as ProfessionalFacts;
    return cachedFacts;
  } catch (err) {
    throw new Error(
      `Could not load professionalFacts.json from any candidate path:\n${candidatePaths.join("\n")}`
    );
  }
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractSkillAliases(skill: string): string[] {
  const aliases = new Set<string>();
  const lower = skill.toLowerCase().trim();
  aliases.add(lower);

  // Extract content inside parentheses: e.g. "Retrieval-Augmented Generation (RAG)" -> "RAG"
  // e.g. "OpenAI (GPT-4 / GPT-4o)" -> "GPT-4", "GPT-4o"
  const parensMatch = skill.match(/\(([^)]+)\)/);
  if (parensMatch) {
    const inside = parensMatch[1];
    inside.split(/[/,]/).forEach(part => {
      const trimmed = part.trim().toLowerCase();
      if (trimmed.length > 0) {
        aliases.add(trimmed);
      }
    });

    // Also part before parenthesis
    const beforeParens = skill.replace(/\s*\([^)]*\)/, "").trim().toLowerCase();
    if (beforeParens.length > 0) {
      aliases.add(beforeParens);
    }
  }

  return Array.from(aliases);
}

function matchesSkillAlias(query: string, alias: string): boolean {
  if (alias.length <= 4) {
    return new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(query);
  }
  return query.includes(alias) || new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(query);
}

const PURE_GREETING_REGEX =
  /^(hi|hello|hey|hey there|who are you|introduce yourself|greetings|good morning|good afternoon|good evening)[!?.]*$/i;

function isPureGreeting(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (PURE_GREETING_REGEX.test(q)) return true;

  const stripped = q
    .replace(/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))[,\s!.]*/i, "")
    .replace(/\bplease\b/gi, "")
    .replace(/[?!.]/g, "")
    .trim();

  if (stripped.length === 0) return true;
  if (/^(who are you|introduce yourself|tell me about yourself|who is rohan)$/i.test(stripped)) {
    return true;
  }
  return false;
}

const MAX_CONTEXT_LENGTH = 10000;

export async function retrieveFactsContext(
  query: string,
  onStatusUpdate?: (status: string) => void
): Promise<RetrievalResult> {
  if (onStatusUpdate) onStatusUpdate("Analyzing query intent...");

  const facts = loadProfessionalFacts();
  const normalizedQuery = (query || "").trim().toLowerCase();
  const queryWords = normalizedQuery.replace(/[^a-z0-9#+]/g, " ").split(/\s+/).filter(Boolean);

  const sections: string[] = [];
  const logs: string[] = [];
  let matchedCount = 0;

  // 1. Intent: Pure Greeting Detector
  // For pure greetings or introduction requests without specific entity queries,
  // return concise identity without project/experience dumps.
  if (isPureGreeting(normalizedQuery)) {
    if (onStatusUpdate) onStatusUpdate("Retrieving identity summary...");

    const identityText = [
      "### Identity & Current Role",
      `- **Full Name**: ${facts.full_name} (${facts.name})`,
      `- **Current Role**: ${facts.current_role}`,
      `- **Location**: ${facts.location}`,
      `- **Summary**: Experienced AI Engineer with ${facts.years_experience.total}+ years total experience (${facts.years_experience.generative_ai}+ years in Generative AI, ${facts.years_experience.agentic_ai}+ year(s) in Agentic AI), currently leading production GenAI engineering at Publicis Sapient.`,
      `- **Contact**: ${facts.email} | [LinkedIn](${facts.linkedin}) | [GitHub](${facts.github}) | [Portfolio](${facts.portfolio})`
    ].join("\n");

    return {
      context: identityText,
      retrievalLog: "- 👤 **Intent: Greeting / Identity**: Returned concise identity and current role without dumps.",
      matchedNodesCount: 1
    };
  }

  if (onStatusUpdate) onStatusUpdate("Retrieving relevant facts...");

  // 2. Intent: Numeric / Years of Experience
  const isExperienceQuery =
    /years?(?:\s+of)?\s+experience/i.test(normalizedQuery) ||
    /how\s+many\s+years/i.test(normalizedQuery) ||
    /total\s+(?:years|experience)/i.test(normalizedQuery) ||
    /experience\s+in\s+(?:generative|genai|ai|ml|agentic)/i.test(normalizedQuery) ||
    /\btenure\b/i.test(normalizedQuery);

  if (isExperienceQuery) {
    sections.push([
      "### Experience Summary & Years of Experience",
      `- **Total Professional Experience**: ${facts.years_experience.total}+ years total experience`,
      `- **Generative AI & LLMs Experience**: ${facts.years_experience.generative_ai}+ years of experience in Generative AI`,
      `- **AI / Machine Learning Experience**: ${facts.years_experience.ai_ml}+ years in Machine Learning`,
      `- **Agentic AI Experience**: ${facts.years_experience.agentic_ai}+ year(s) in Agentic AI & Multi-Agent Systems`,
      `- **Current Role**: ${facts.current_role}`
    ].join("\n"));
    logs.push(`- ⏱️ **Years of Experience**: Exact track record (${facts.years_experience.total}+ years total, ${facts.years_experience.generative_ai}+ GenAI)`);
    matchedCount++;
  }

  // 3. Intent: Specific Projects Matching
  const projectAliases: Record<string, string[]> = {
    "Omodore": ["omodore"],
    "Rbetraj": ["rbetraj", "shop scan agent", "ai tech crawler", "ai-tech-crawler", "crawler", "scraping", "scraper"],
    "Galambo": ["galambo", "multi-modal", "multimodal"],
    "Salesmoji": ["salesmoji", "sales", "sales intelligence"],
    "Aisera": ["aisera", "customer service", "traps"],
    "evalmyBRAND": ["evalmybrand", "sentiment analysis", "absa"],
    "Inventted": ["inventted", "education", "clip", "flan-t5"],
    "Mice Protein Expression Analysis": ["mice", "protein", "bioinformatics"]
  };

  const matchedProjects: ProjectItem[] = [];
  const projectMentions = /\b(projects?|portfolio|what have you built|apps?|applications?)\b/i.test(normalizedQuery);

  for (const project of facts.projects) {
    const aliases = projectAliases[project.name] || [project.name.toLowerCase()];
    const isDirectMatch = aliases.some(alias => normalizedQuery.includes(alias));
    if (isDirectMatch) {
      matchedProjects.push(project);
    }
  }

  // If user asked generally about projects and no specific one matched, return top 2 flagship projects
  if (matchedProjects.length === 0 && projectMentions) {
    matchedProjects.push(facts.projects[0]); // Omodore
    matchedProjects.push(facts.projects[1]); // Rbetraj
  }

  // 4. Intent: Company / Work Experience Matching
  const companyAliases: Record<string, string[]> = {
    "Publicis Sapient": ["publicis sapient", "publicis", "sapient"],
    "R Systems International": ["r systems", "rsystems", "lendistry"],
    "AI Tech Solutions Ltd.": ["ai tech solutions", "ai tech", "ai-tech"],
    "Aimlytics Technology": ["aimlytics"],
    "iNeuron.ai": ["ineuron"],
    "Bureau Veritas Group": ["bureau veritas", "metallurgical"]
  };

  const matchedExperience: ExperienceItem[] = [];
  const careerMentions = /\b(career|companies|where have you worked|work history|employment|employers|past work)\b/i.test(normalizedQuery);

  for (const exp of facts.experience) {
    const aliases = companyAliases[exp.company] || [exp.company.toLowerCase()];
    const isDirectMatch = aliases.some(alias => normalizedQuery.includes(alias));
    if (isDirectMatch) {
      matchedExperience.push(exp);
    }
  }

  if (matchedExperience.length === 0 && careerMentions) {
    // Default to current and previous roles
    matchedExperience.push(facts.experience[0]); // Publicis Sapient
    matchedExperience.push(facts.experience[1]); // R Systems
  }

  // 5. Intent: Skills & Tech Stack Matching
  const isTechStackQuery = /\b(tech stack|skills|specialties|technologies|tools|languages|frameworks)\b/i.test(normalizedQuery);
  const matchedSpecialties: Array<{ category: string; skills: string[] }> = [];

  for (const [category, skillsList] of Object.entries(facts.specialties)) {
    const categoryAliases = extractSkillAliases(category);
    const categoryMatches = categoryAliases.some(alias => matchesSkillAlias(normalizedQuery, alias));

    const matchingSkills = skillsList.filter(skill => {
      const aliases = extractSkillAliases(skill);
      return aliases.some(alias => matchesSkillAlias(normalizedQuery, alias));
    });

    if (isTechStackQuery) {
      matchedSpecialties.push({ category, skills: skillsList });
    } else if (matchingSkills.length > 0) {
      matchedSpecialties.push({ category, skills: matchingSkills });
    } else if (categoryMatches) {
      matchedSpecialties.push({ category, skills: skillsList });
    }
  }

  // If specific skills were searched, also find projects and experience that used those skills
  if (matchedSpecialties.length > 0 && !isTechStackQuery) {
    const matchedSkillAliases = matchedSpecialties.flatMap(s =>
      s.skills.flatMap(skill => extractSkillAliases(skill))
    );

    // Cross-match projects
    for (const project of facts.projects) {
      if (!matchedProjects.includes(project)) {
        const hasSkill = project.skills_used.some(projSkill => {
          const projAliases = extractSkillAliases(projSkill);
          return matchedSkillAliases.some(skillAlias =>
            projAliases.some(projAlias => matchesSkillAlias(projAlias, skillAlias) || matchesSkillAlias(skillAlias, projAlias))
          );
        });
        if (hasSkill) {
          matchedProjects.push(project);
        }
      }
    }

    // Cross-match experience
    for (const exp of facts.experience) {
      if (!matchedExperience.includes(exp)) {
        const hasSkill = exp.skills_used.some(expSkill => {
          const expAliases = extractSkillAliases(expSkill);
          return matchedSkillAliases.some(skillAlias =>
            expAliases.some(expAlias => matchesSkillAlias(expAlias, skillAlias) || matchesSkillAlias(skillAlias, expAlias))
          );
        });
        if (hasSkill) {
          matchedExperience.push(exp);
        }
      }
    }
  }

  // 6. Intent: Education & Certifications
  const isEducationQuery = /\b(education|degree|university|college|btech|b\.tech|gate|academics)\b/i.test(normalizedQuery);
  const isCertificationQuery = /\b(certifications?|certificates?|badge|hackerrank|kaggle|zoomcamp|awards?)\b/i.test(normalizedQuery);

  // Context Assembly
  if (matchedSpecialties.length > 0) {
    const lines = ["### Technical Specialties & Skills"];
    for (const { category, skills } of matchedSpecialties) {
      lines.push(`- **${category}**: ${skills.join(", ")}`);
    }
    sections.push(lines.join("\n"));
    logs.push(`- 🛠️ **Specialties & Skills**: Matched ${matchedSpecialties.length} specialty categories`);
    matchedCount += matchedSpecialties.length;
  }

  for (const exp of matchedExperience) {
    const expLines = [
      `### Professional Experience: ${exp.company}`,
      `- **Role & Title**: ${exp.title}`,
      `- **Duration**: ${exp.start_date} – ${exp.end_date}`,
      `- **Location**: ${exp.location}`,
      ...(exp.client ? [`- **Client**: ${exp.client}`] : []),
      "- **Key Responsibilities**:",
      ...exp.responsibilities.map(r => `  - ${r}`),
      `- **Skills Used**: ${exp.skills_used.join(", ")}`
    ];
    sections.push(expLines.join("\n"));
    logs.push(`- 💼 **Experience Node**: ${exp.company} (${exp.title})`);
    matchedCount++;
  }

  for (const proj of matchedProjects) {
    const projLines = [
      `### Project: ${proj.name}`,
      `- **Domain**: ${proj.domain}`,
      `- **Description**: ${proj.description}`,
      `- **Skills Used**: ${proj.skills_used.join(", ")}`,
      "- **Key Responsibilities & Deliverables**:",
      ...proj.responsibilities.map(r => `  - ${r}`)
    ];
    sections.push(projLines.join("\n"));
    logs.push(`- 🚀 **Project Node**: ${proj.name} (${proj.domain})`);
    matchedCount++;
  }

  if (isEducationQuery) {
    const eduLines = ["### Education & Academic Qualifications"];
    for (const edu of facts.education) {
      if (edu.degree) {
        eduLines.push(`- **Degree**: ${edu.degree} — ${edu.institution} (${edu.year}) [${edu.details || ""}]`);
      } else if (edu.title) {
        eduLines.push(`- **Qualification**: ${edu.title} (${edu.discipline}) — ${edu.issuer} (${edu.year}) [ID: ${edu.credential_id || ""}]`);
      }
    }
    sections.push(eduLines.join("\n"));
    logs.push("- 🎓 **Education**: Degree & GATE qualification nodes");
    matchedCount++;
  }

  if (isCertificationQuery) {
    const certLines = ["### Certifications & Achievements"];
    for (const cert of facts.certifications) {
      certLines.push(`- **${cert.name}**: ${cert.issuer}${cert.credential_id ? ` (ID: ${cert.credential_id})` : ""}${cert.achievement ? ` [${cert.achievement}]` : ""}`);
    }
    sections.push(certLines.join("\n"));
    logs.push("- 🏆 **Certifications**: Professional certifications & achievements");
    matchedCount++;
  }

  // Fallback if no specific entity matched
  if (sections.length === 0) {
    if (/^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))\b/i.test(normalizedQuery)) {
      sections.push([
        "### Identity & Current Role",
        `- **Full Name**: ${facts.full_name} (${facts.name})`,
        `- **Current Role**: ${facts.current_role}`,
        `- **Location**: ${facts.location}`,
        `- **Summary**: Experienced AI Engineer with ${facts.years_experience.total}+ years total experience (${facts.years_experience.generative_ai}+ years in Generative AI, ${facts.years_experience.agentic_ai}+ year(s) in Agentic AI), currently leading production GenAI engineering at Publicis Sapient.`,
        `- **Contact**: ${facts.email} | [LinkedIn](${facts.linkedin}) | [GitHub](${facts.github}) | [Portfolio](${facts.portfolio})`
      ].join("\n"));
      logs.push("- 👤 **Intent: Greeting / Conversational Opening**: Returned concise identity and current role.");
      matchedCount = 1;
    } else {
      sections.push([
        "### Identity & Profile Overview",
        `- **Full Name**: ${facts.full_name} (${facts.name})`,
        `- **Current Role**: ${facts.current_role}`,
        `- **Experience**: ${facts.years_experience.total}+ years total (${facts.years_experience.generative_ai}+ in Generative AI)`,
        `- **Location**: ${facts.location}`,
        `- **Key Focus**: Enterprise GenAI architectures, multi-agent systems with MCP & LangGraph, and high-performance ML pipelines.`
      ].join("\n"));
      logs.push("- ℹ️ **Default Profile Overview**: General profile overview returned.");
      matchedCount = 1;
    }
  }

  // Length budget control
  let assembledContext = sections.join("\n\n---\n\n");
  if (assembledContext.length > MAX_CONTEXT_LENGTH) {
    assembledContext = assembledContext.slice(0, MAX_CONTEXT_LENGTH) + "\n\n...(context trimmed for length)";
  }

  return {
    context: assembledContext,
    retrievalLog: logs.join("\n"),
    matchedNodesCount: matchedCount
  };
}
