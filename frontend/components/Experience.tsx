"use client";

import { motion } from "framer-motion";

const experiences = [
  {
    company: "AI Tech Solutions Ltd.",
    role: "AI Engineer — Backend & AI Systems Architecture",
    duration: "Nov 2024 – Oct 2025",
    type: "Full-time",
    focus: "Agentic AI Platforms · Multi-Agent Orchestration · Advanced RAG",
    dotColor: "var(--accent-cyan)",
    highlights: [
      "Led 15-member team building production-grade Agentic AI systems with autonomous decision-making",
      "Developed modular ML pipelines (Omodore) achieving 38% accuracy improvement via advanced RAG architecture",
      "Designed multi-agent orchestration using LangGraph for complex enterprise workflow automation",
      "Deployed containerized AI systems with Docker + vector databases (Qdrant, Milvus, Weaviate) for semantic search at scale",
      "Built automated web scraping platform (Rbetraj) with Playwright + Selenium for real-time e-commerce data extraction",
      "Architected multi-modal agentic AI assistant (GALAMBO) with GPT-4, image search & autonomous tool use",
    ],
    tech: ["LangChain", "LangGraph", "FastAPI", "RAG", "Agent Orchestration", "Multi-Agent Systems", "Docker", "Qdrant"],
  },
  {
    company: "Aimlytics Technology",
    role: "Software Engineer — Generative AI | ML | Python",
    duration: "Sep 2022 – Oct 2024",
    type: "Full-time",
    focus: "Enterprise-scale GenAI & NLP for Fortune 500 Clients",
    dotColor: "var(--accent-pink)",
    highlights: [
      "Led 8-member team delivering custom AI workflows for Cisco, ITC Fairview, KDP, Omnitrax, PDS, Marco Technologies",
      "Architected RAG-based virtual sales assistant (SalesMoji) reliably handling 4,500+ daily API requests",
      "Orchestrated data pipelines processing 100K+ daily records using Apache Airflow for automated ML workflows",
      "Fine-tuned BERT & RoBERTa for sentiment analysis, NER & text classification — 18% performance improvement",
      "Implemented vector DB solutions (Qdrant, Milvus, Weaviate, Chroma) for enterprise semantic retrieval",
      "Built 15+ language NLP translation pipeline (evalmyBRAND) · CLIP/Flan-T5 fine-tuning (InventtEd)",
      "Resolved 28 critical production tickets with 100% on-time delivery",
    ],
    tech: ["Python", "RAG", "LangChain", "BERT", "RoBERTa", "Airflow", "FastAPI", "GCP", "MongoDB"],
  },
  {
    company: "iNeuron.ai",
    role: "Machine Learning Engineer Intern",
    duration: "Aug 2021 – Sep 2022",
    type: "Internship",
    focus: "ML Pipeline Development · Hyperparameter Optimization · MLOps",
    dotColor: "var(--accent-purple)",
    highlights: [
      "Led team of 10 building automated ML pipeline architectures for multi-class classification",
      "Implemented Optuna hyperparameter optimization — 35% training time reduction",
      "Built 77-marker protein expression classification system across 8 classes for bioinformatics research",
      "Deployed containerized ML applications using Flask + Docker on Linux/AWS",
    ],
    tech: ["Python", "Flask", "Scikit-Learn", "Optuna", "MySQL", "Cassandra", "Docker", "AWS"],
  },
  {
    company: "Bureau Veritas Group",
    role: "Metallurgical Quality Engineer",
    duration: "Aug 2016 – Nov 2019",
    type: "Full-time",
    focus: "Quality Assurance · Statistical Analysis · Industrial Analytics",
    dotColor: "var(--accent-green, #34d399)",
    highlights: [
      "Quality assurance for metals & minerals at Jindal Steels, Vedanta Aluminum, and Tata Steels",
      "Conducted metallurgical testing, statistical analysis & data-driven quality improvement",
      "Managed quality standards compliance across three major steel manufacturing facilities",
    ],
    tech: ["Statistical Analysis", "Quality Control", "Data Analysis", "Industrial Testing"],
  },
];

export default function Experience() {
  return (
    <section id="experience" style={{ position: "relative", zIndex: 2 }}>
      <div className="section-divider" />
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-label">03 / Experience</p>
          <h2 className="section-heading gradient-text-cyan-pink">
            Career Journey
          </h2>
          <p className="mb-16" style={{ color: "var(--text-secondary)", maxWidth: "600px" }}>
            7+ years of professional experience — from industrial quality engineering
            to building production-grade Agentic AI systems for Fortune 500 enterprises.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative pl-12">
          {/* Vertical line */}
          <div className="timeline-line" />

          {experiences.map((exp, i) => (
            <motion.div
              key={exp.company}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.15 }}
              className="relative mb-12 last:mb-0"
            >
              {/* Dot */}
              <div
                className="timeline-dot"
                style={{ background: exp.dotColor, boxShadow: `0 0 16px ${exp.dotColor}88` }}
              />

              {/* Card */}
              <div className="card p-6 ml-4">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h3
                      className="font-orbitron font-bold mb-1"
                      style={{ color: exp.dotColor, fontSize: "1.15rem" }}
                    >
                      {exp.company}
                    </h3>
                    <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                      {exp.role}
                    </p>
                    <p className="text-xs italic" style={{ color: "var(--text-secondary)" }}>
                      {exp.focus}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className="block text-xs font-fira mb-1"
                      style={{ color: exp.dotColor }}
                    >
                      {exp.duration}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5"
                      style={{
                        background: `${exp.dotColor}18`,
                        color: exp.dotColor,
                        border: `1px solid ${exp.dotColor}44`,
                      }}
                    >
                      {exp.type}
                    </span>
                  </div>
                </div>

                {/* Highlights */}
                <ul className="mb-5 space-y-2">
                  {exp.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex gap-2 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <span style={{ color: exp.dotColor, flexShrink: 0, marginTop: "2px" }}>▹</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-2">
                  {exp.tech.map((t) => (
                    <span key={t} className="tech-tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
