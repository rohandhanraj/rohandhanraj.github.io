// TypeScript types for the portfolio system

export interface PersonalInfo {
  name: string;
  title: string;
  tagline: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  links: {
    linkedin: string;
    github: string;
    portfolio: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  duration: string;
  type: string;
  focus: string;
  highlights: string[];
  tech: string[];
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  duration: string;
  featured: boolean;
  url?: string;
  github?: string;
  description: string;
  highlights: string[];
  tech: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  year: string;
  note?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  credential_id?: string;
  year: string;
  achievement?: string;
}

export interface Skills {
  languages: string[];
  ml_dl: string[];
  generative_ai: string[];
  nlp: string[];
  data_engineering: string[];
  analytics: string[];
  web_scraping: string[];
  devops: string[];
}

export interface SourceOfTruth {
  meta: { version: string; generated: string; sources: string[] };
  personal: PersonalInfo;
  stats: Record<string, string>;
  experience: Experience[];
  projects: Project[];
  skills: Skills;
  education: Education[];
  certifications: Certification[];
  achievements: string[];
}

// Chat types
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string (JSON-safe for Data API)
}

export interface VisitorInfo {
  ip: string;
  country: string;
  city: string;
  region: string;
  timezone: string;
  userAgent: string;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  visitor: VisitorInfo;
  createdAt: string;
  updatedAt: string;
}

// Document tree types
export interface DocNode {
  id: string;
  section: string;
  label: string;
  keywords: string[];
  content: string;
  children?: DocNode[];
}
