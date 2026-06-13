"use client";

import { motion } from "framer-motion";

const skillCategories = [
  {
    label: "Generative AI & LLM",
    color: "var(--accent-cyan)",
    icon: "🧠",
    tags: ["LLMs", "Vertex AI", "OpenAI", "Anthropic", "LangChain", "LangGraph", "Structured Outputs", "RAG Pipelines", "Prompt Chaining", "Chain-of-Thought"],
  },
  {
    label: "ML & Deep Learning",
    color: "var(--accent-pink)",
    icon: "⚡",
    tags: ["Scikit-Learn", "TensorFlow", "Keras", "PyTorch", "Optuna", "HuggingFace", "Model Fine-tuning", "Hyperparameter Tuning", "PyCaret"],
  },
  {
    label: "Languages & Frameworks",
    color: "var(--accent-purple)",
    icon: "💻",
    tags: ["Python", "FastAPI", "Flask", "Django", "Streamlit"],
  },
  {
    label: "Data Engineering & DBs",
    color: "var(--accent-green)",
    icon: "🗄️",
    tags: ["Apache Airflow", "ETL Processes", "SQL (MySQL, Postgres)", "NoSQL (MongoDB, Cassandra)", "Vector DBs", "Qdrant", "Milvus", "Weaviate", "Pinecone", "Chroma", "LanceDB"],
  },
  {
    label: "NLP",
    color: "var(--accent-cyan)",
    icon: "📝",
    tags: ["Spacy", "NLTK", "Transformers", "Sentiment Analysis", "NER", "Text Classification", "Aspect-Based Sentiment", "Summarization", "Q&A", "Machine Translation"],
  },
  {
    label: "DevOps, Cloud & MLOps",
    color: "var(--accent-pink)",
    icon: "☁️",
    tags: ["Git / GitHub", "Docker", "CI/CD (Actions, Jenkins)", "GCP", "AWS", "MLOps"],
  },
  {
    label: "Agentic AI & Agents",
    color: "var(--accent-purple)",
    icon: "🤖",
    tags: ["Agent Orchestration", "Multi-Agent Systems", "Tool Integration", "Memory Management", "Autonomous Decision-Making", "Autonomous AI Agents", "Design Patterns (ReAct, Reflexion)"],
  },
  {
    label: "Extraction & Analytics",
    color: "var(--accent-green)",
    icon: "📊",
    tags: ["Playwright", "Selenium", "Scrapy", "BeautifulSoup", "NumPy", "Pandas", "Matplotlib", "Seaborn", "Plotly", "SciPy", "Statistical Analysis"],
  },
];

export default function Skills() {
  return (
    <section id="skills" style={{ position: "relative", zIndex: 2 }}>
      <div className="section-divider" />
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-label">02 / Skills</p>
          <h2 className="section-heading gradient-text-cyan-pink">
            Technical Arsenal
          </h2>
          <p className="mb-12" style={{ color: "var(--text-secondary)", maxWidth: "600px" }}>
            Comprehensive expertise across the full AI/ML stack — from LLM
            fine-tuning to production DevOps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {skillCategories.map((cat, i) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card p-5"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{cat.icon}</span>
                <span
                  className="font-orbitron font-bold text-xs uppercase tracking-widest"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {cat.tags.map((tag) => (
                  <span
                    key={tag}
                    className="tech-tag"
                    style={{
                      background: `${cat.color}11`,
                      color: cat.color,
                      borderColor: `${cat.color}33`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
