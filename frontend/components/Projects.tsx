"use client";

import { motion } from "framer-motion";

const projects = [
  {
    id: "document-intelligence",
    name: "DOCUMENT INTELLIGENCE",
    tagline: "Multi-Modal Financial Document Intelligence",
    domain: "Financial Lending",
    client: "Lendistry",
    company: "R Systems",
    featured: true,
    description:
      "AI-powered document intelligence system classifying loan documents (W-2s, tax returns, bank statements) and extracting structured data for credit decisioning with automated PII redaction and strict validation guardrails.",
    highlights: ["Multi-modal document parsing", "Automated PII redaction & safety guardrails", "Credit underwriting pipeline integration"],
    tech: ["Python", "FastAPI", "Multi-Modal AI", "Pydantic", "AWS", "Docker", "PII Redaction", "Guardrails"],
    accentColor: "var(--accent-cyan)",
    icon: "📄",
  },
  {
    id: "origen-assistant",
    name: "ORIGEN ASSISTANT",
    tagline: "Fintech Conversational Lending Agent",
    domain: "Fintech & Lending Agent",
    client: "Lendistry",
    company: "R Systems",
    featured: true,
    description:
      "Conversational lending portal assistant guiding borrowers to understand complex financial terminology, navigate the portal, and smart-fill loan applications using extracted document data with conversational safety guardrails and PII redaction.",
    highlights: ["Model Context Protocol (MCP)", "Smart-fill loan applications", "Strict safety guardrails & PII redaction"],
    tech: ["Python", "Generative AI", "LLMs", "RAG", "Agentic Workflows", "MCP Tools", "FastAPI", "AWS", "PII Redaction", "Guardrails"],
    accentColor: "var(--accent-pink)",
    icon: "🤝",
  },
  {
    id: "omodore",
    name: "OMODORE",
    tagline: "Autonomous Agent Platform",
    domain: "AI Agent Platform",
    featured: true,
    url: "https://omodore.com",
    github: "https://github.com/rohandhanraj/omodore",
    description:
      "Revolutionary no-code platform enabling non-technical users to build sophisticated domain-specific AI agents. Achieved 38% accuracy improvement through advanced RAG pipeline architecture.",
    highlights: ["38% accuracy boost via RAG", "No-code agent builder", "LangGraph multi-agent orchestration"],
    tech: ["Agentic AI", "LangChain", "LangGraph", "FastAPI", "RAG", "Qdrant", "Docker"],
    accentColor: "var(--accent-purple)",
    icon: "🤖",
  },
  {
    id: "rbetraj",
    name: "RBETRAJ",
    tagline: "Agentic E-commerce Scraper",
    domain: "Data Intelligence",
    featured: true,
    url: "https://rbetraj.com",
    github: "https://github.com/rohandhanraj/rbetraj",
    description:
      "Open-source agentic scraping platform combining LLM intelligence with Pydantic-validated structured data extraction for e-commerce competitive analysis.",
    highlights: ["LLM-guided extraction", "Pydantic structured output", "Real-time price tracking"],
    tech: ["Agentic AI", "Python", "Playwright", "GPT", "LangChain", "Pydantic", "FastAPI"],
    accentColor: "var(--accent-green)",
    icon: "🕷️",
  },
  {
    id: "salesmoji",
    name: "SALESMOJI",
    tagline: "Agentic Virtual Sales Assistant",
    domain: "Sales Intelligence",
    featured: false,
    description:
      "RAG-based virtual sales assistant and conversational agent answering natural language sales queries, managing leads, and driving pipeline conversions.",
    highlights: ["Virtual sales agent", "RAG-driven pipeline insights", "Natural language lead queries"],
    tech: ["Agentic AI", "Python", "FastAPI", "LangChain", "LangGraph", "RAG", "Qdrant", "Docker"],
    accentColor: "var(--accent-purple)",
    icon: "💼",
  },
  {
    id: "aisera",
    name: "AISERA",
    tagline: "Enterprise AI for Fortune 500",
    domain: "Customer Service AI",
    featured: false,
    description:
      "Enterprise Generative AI virtual assistant processing 100K+ daily records and 4,500+ daily API requests for Fortune 500 clients (Cisco, ITC, KDP, Marco, PDS, Omnitrax). BERT fine-tuning with 18% performance gain.",
    highlights: ["100K+ daily records via Airflow", "4,500+ daily API requests", "Cisco, ITC, KDP clients"],
    tech: ["Agentic AI", "BERT", "LangChain", "LangGraph", "RAG", "Airflow", "FastAPI", "GCP"],
    accentColor: "var(--accent-cyan)",
    icon: "🏢",
  },
  {
    id: "evalmybrand",
    name: "evalmyBRAND",
    tagline: "Brand Analytics Platform",
    domain: "Customer Experience",
    featured: false,
    description:
      "AI-powered brand analytics with 15+ language support. Fine-tuned RoBERTa for aspect-based sentiment analysis, NER, and text classification with 18% performance improvement.",
    highlights: ["15+ languages", "RoBERTa 18% gain", "Aspect-based sentiment & NER"],
    tech: ["RoBERTa", "BERT", "NER", "Text Classification", "FastAPI", "Airflow", "MongoDB"],
    accentColor: "var(--accent-pink)",
    icon: "📈",
  },
  {
    id: "inventted",
    name: "InventtEd",
    tagline: "AI Education Platform",
    domain: "EdTech & Multi-Modal",
    featured: false,
    description:
      "Pioneer education platform with multi-modal vision models (CLIP, Flan-T5), real-time tool usage, intelligent text summarization, automated essay grading, and AI tutoring bot.",
    highlights: ["CLIP & Flan-T5 models", "Multi-modal vision & tool use", "Automated essay grading"],
    tech: ["CLIP", "Flan-T5", "LangChain", "Multi-Modal AI", "FastAPI", "GCP"],
    accentColor: "var(--accent-purple)",
    icon: "🎓",
  },
  {
    id: "mice",
    name: "Protein Classifier",
    tagline: "Bioinformatics ML System",
    domain: "Medical AI",
    featured: false,
    github: "https://github.com/rohandhanraj/mice-protein-expression",
    description:
      "Multi-class ML system classifying 77 protein expression levels across 8 classes for Down syndrome research. 35% training time reduction via Optuna.",
    highlights: ["77 proteins, 8 classes", "35% faster with Optuna", "Led 10-member team"],
    tech: ["Scikit-Learn", "Optuna", "Flask", "MySQL", "Docker"],
    accentColor: "var(--accent-green)",
    icon: "🔬",
  },
];

export default function Projects() {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <section id="projects" style={{ position: "relative", zIndex: 2 }}>
      <div className="section-divider" />
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-label">04 / Projects</p>
          <h2 className="section-heading gradient-text-cyan-pink">
            AI Systems Built
          </h2>
          <p className="mb-12" style={{ color: "var(--text-secondary)", maxWidth: "600px" }}>
            Production-grade AI applications — from autonomous agent platforms
            to enterprise-scale RAG systems.
          </p>
        </motion.div>

        {/* Featured */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {featured.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.1 }}
              className="card p-6 shimmer-card"
            >
              {/* Top bar */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <span
                      className="block text-xs uppercase tracking-widest mb-0.5"
                      style={{ color: p.accentColor, fontFamily: "'Fira Code', monospace" }}
                    >
                      {p.domain}{(p as any).client ? ` · Client: ${(p as any).client}` : ""}
                    </span>
                    <h3
                      className="font-orbitron font-bold"
                      style={{ color: "var(--text-primary)", fontSize: "1.1rem" }}
                    >
                      {p.name}
                    </h3>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 hover:opacity-80 transition-opacity"
                      style={{
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      GitHub
                    </a>
                  )}
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 hover:opacity-80 transition-opacity"
                      style={{
                        color: p.accentColor,
                        border: `1px solid ${p.accentColor}44`,
                      }}
                    >
                      Live ↗
                    </a>
                  )}
                </div>
              </div>

              <p
                className="text-sm mb-4 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {p.description}
              </p>

              {/* Key metrics */}
              <ul className="mb-4 space-y-1">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span style={{ color: p.accentColor, flexShrink: 0 }}>◆</span>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                {p.tech.map((t) => (
                  <span
                    key={t}
                    className="tech-tag"
                    style={{
                      background: `${p.accentColor}10`,
                      color: p.accentColor,
                      borderColor: `${p.accentColor}30`,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Other projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {others.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08 }}
              className="card p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{p.icon}</span>
                <h3 className="font-orbitron font-bold text-sm" style={{ color: p.accentColor }}>
                  {p.name}
                </h3>
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {p.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {p.tech.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="tech-tag"
                    style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              {p.github && (
                <a
                  href={p.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs block hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                >
                  GitHub ↗
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
