"use client";

import { motion } from "framer-motion";

const contactLinks = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={28} height={28}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
    label: "Email",
    value: "rohan.dhanraj.y@gmail.com",
    href: "mailto:rohan.dhanraj.y@gmail.com",
    color: "var(--accent-cyan)",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    label: "LinkedIn",
    value: "rohan-dhanraj-yadav",
    href: "https://www.linkedin.com/in/rohan-dhanraj-yadav",
    color: "var(--accent-cyan)",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    label: "GitHub",
    value: "rohandhanraj",
    href: "https://github.com/rohandhanraj",
    color: "var(--accent-purple)",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={28} height={28}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25z" />
      </svg>
    ),
    label: "Phone",
    value: "+91-7008958143",
    href: "tel:+917008958143",
    color: "var(--accent-pink)",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width={28} height={28}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    label: "Twitter / X",
    value: "@rdx2496",
    href: "https://twitter.com/rdx2496",
    color: "var(--accent-cyan)",
  },
];

const achievements = [
  { value: "🥇", label: "HackerRank Gold", sub: "Python · Problem Solving · Statistics" },
  { value: "#69", label: "Kaggle Rank", sub: "30 Days of ML · 7,573 teams" },
  { value: "50%", label: "Model Boost", sub: "BERT & RoBERTa fine-tuned" },
  { value: "1M+", label: "Records/Day", sub: "Airflow production pipelines" },
];

export default function Contact() {
  return (
    <section id="contact" style={{ position: "relative", zIndex: 2 }}>
      <div className="section-divider" />
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="section-label">06 / Contact</p>
          <h2 className="section-heading gradient-text-cyan-pink">
            Let&apos;s Build Together
          </h2>
          <p className="mx-auto max-w-xl" style={{ color: "var(--text-secondary)" }}>
            Open to exciting AI/ML opportunities, collaborations, and consulting.
            Reach out — I respond within 24 hours.
          </p>
        </motion.div>

        {/* Contact cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16 max-w-4xl mx-auto">
          {contactLinks.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.03 }}
              className="card p-5 text-center group"
              style={{ textDecoration: "none" }}
            >
              <div
                className="flex justify-center mb-3 transition-all duration-300 group-hover:scale-110"
                style={{ color: link.color }}
              >
                {link.icon}
              </div>
              <p
                className="text-xs uppercase tracking-widest mb-1"
                style={{ color: link.color, fontFamily: "'Fira Code', monospace" }}
              >
                {link.label}
              </p>
              <p
                className="text-xs break-all"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.value}
              </p>
            </motion.a>
          ))}
        </div>

        {/* Achievements strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12"
        >
          {achievements.map((a) => (
            <div
              key={a.label}
              className="text-center p-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span
                className="block text-2xl font-orbitron font-black mb-1"
                style={{ color: "var(--accent-cyan)" }}
              >
                {a.value}
              </span>
              <p className="font-bold text-xs mb-0.5" style={{ color: "var(--text-primary)" }}>
                {a.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {a.sub}
              </p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="mailto:rohan.dhanraj.y@gmail.com"
            className="btn-cyber btn-primary-cyber text-lg"
          >
            Send an Email
          </a>
        </motion.div>

        {/* Footer */}
        <div className="mt-20 pt-6 text-center" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'Fira Code', monospace" }}>
            &lt;/&gt; with ❤️ by Rohan Dhanraj Yadav · © {new Date().getFullYear()} · Powered by AI &amp; Innovation
          </p>
        </div>
      </div>
    </section>
  );
}
