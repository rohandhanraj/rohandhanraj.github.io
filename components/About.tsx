"use client";

import { motion } from "framer-motion";

const certs = [
  { icon: "🏆", name: "GATE ME 2016", issuer: "IIT/NTA", id: "A2WR3" },
  { icon: "🏅", name: "ML Zoom Camp", issuer: "DataTalksClub", id: "8F163B" },
  { icon: "🥇", name: "Gold Badge: Python", issuer: "HackerRank", id: "6920934A49FA" },
  { icon: "🥇", name: "Gold Badge: Problem Solving", issuer: "HackerRank", id: "113775E95540" },
  { icon: "🥇", name: "Gold Badge: Statistics", issuer: "HackerRank", id: "10-day challenge" },
  { icon: "📊", name: "30 Days of ML", issuer: "Kaggle", id: "Rank 69 / 7,573 teams" },
];

export default function About() {
  return (
    <section id="about" style={{ position: "relative", zIndex: 2 }}>
      <div className="section-divider" />
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 items-start">
          {/* Left: Bio */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-label">01 / About</p>
            <h2 className="section-heading gradient-text-cyan-pink">
              Building the
              <br />
              Future of AI
            </h2>

            <div
              className="space-y-4 text-sm leading-relaxed mb-8"
              style={{ color: "var(--text-secondary)" }}
            >
              <p>
                I&apos;m a{" "}
                <span style={{ color: "var(--accent-cyan)" }} className="font-semibold">
                  Senior AI/ML Engineer
                </span>{" "}
                specializing in Generative AI and Agentic AI systems. With 7+ years of total professional
                experience—including over 4 years building production-grade AI from data pipelines to autonomous agents—I&apos;ve
                dedicated the last 2+ years to mastering{" "}
                <span style={{ color: "var(--accent-pink)" }}>Generative AI</span> and
                the last 1+ year specifically to building autonomous AI agents.
              </p>
              <p>
                Expert in architecting robust backend infrastructure for{" "}
                <span style={{ color: "var(--accent-purple)" }}>Agentic workflows</span> using
                LangChain, LangGraph, and Python — alongside FastAPI, Docker, and Airflow
                for production orchestration.
              </p>
              <p>
                Led cross-functional teams of{" "}
                <span style={{ color: "var(--accent-cyan)" }}>15+ engineers</span>{" "}
                delivering AI solutions for Fortune 500 clients including{" "}
                <span style={{ color: "var(--accent-pink)" }}>Cisco, ITC Fairview, KDP</span>,
                and Marco Technologies. Passionate about making AI accessible,
                practical, and transformative.
              </p>
            </div>

            {/* Education */}
            <div
              className="p-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-3"
                style={{ color: "var(--accent-cyan)", fontFamily: "'Fira Code', monospace" }}
              >
                Education
              </p>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                B.E. — Mechanical Engineering
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Biju Patnaik University of Technology · 2016
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--accent-green)" }}>
                GATE Qualified · Credential ID: A2WR3
              </p>
            </div>
          </motion.div>

          {/* Right: Certifications */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p
              className="font-orbitron font-bold text-xs uppercase tracking-widest mb-6"
              style={{ color: "var(--accent-pink)" }}
            >
              Certifications &amp; Achievements
            </p>

            <div className="space-y-3">
              {certs.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i }}
                  className="flex items-center gap-4 p-4"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderLeft: "3px solid var(--accent-cyan)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderLeftColor = "var(--accent-pink)";
                    (e.currentTarget as HTMLElement).style.transform = "translateX(6px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderLeftColor = "var(--accent-cyan)";
                    (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{c.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                      {c.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      {c.issuer} · <span style={{ color: "var(--accent-cyan)" }}>{c.id}</span>
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
