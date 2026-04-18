"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ResumeModal from "./ResumeModal";
import ModalPortal from "./ModalPortal";

const ROLES = [
  "AI/ML Engineer",
  "Generative AI Developer",
  "Multi-Agent Systems Architect",
  "RAG Pipeline Expert",
  "LLM Fine-tuning",
  "AI Platform Engineer"
];

function useTypingEffect(words: string[], speed = 80, pause = 1800) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex % words.length];
    
    if (!isDeleting && text === current) {
      const timeout = setTimeout(() => setIsDeleting(true), pause);
      return () => clearTimeout(timeout);
    }
    
    if (isDeleting && text === "") {
      setIsDeleting(false);
      setWordIndex((i) => i + 1);
      return;
    }
    
    const timeout = setTimeout(() => {
      setText((prev) =>
        isDeleting
          ? current.slice(0, prev.length - 1)
          : current.slice(0, prev.length + 1)
      );
    }, isDeleting ? speed / 2 : speed);
    
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, speed, pause]);

  return text;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${p.alpha})`;
        ctx.fill();
      }
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: 0.5 }}
    />
  );
}

const stats = [
  { value: "7+", label: "Years Experience" },
  { value: "4+", label: "Years AI/ML" },
  { value: "8+", label: "AI Projects" },
  { value: "89%", label: "Production Accuracy" },
];

export default function Hero() {
  const role = useTypingEffect(ROLES);
  const [showModal, setShowModal] = useState(false);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center"
      style={{ zIndex: 2 }}
    >
      <ParticleCanvas />

      <div className="section-container w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-16 items-center">
          {/* ── Left: Text ── */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-fira text-sm mb-4"
              style={{ color: "var(--accent-green)" }}
            >
              &gt; Hello, World! — Initializing Portfolio...
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-orbitron font-black uppercase mb-4 gradient-text"
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: 1.05, letterSpacing: "-2px" }}
            >
              Rohan
              <br />
              Dhanraj
              <br />
              Yadav
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex items-center gap-2 mb-6"
              style={{ minHeight: "2rem" }}
            >
              <span
                className="font-fira text-base md:text-lg"
                style={{ color: "var(--text-secondary)" }}
              >
                {role}
              </span>
              <span
                className="animate-blink"
                style={{ color: "var(--accent-cyan)", fontSize: "1.25rem" }}
              >
                |
              </span>
            </motion.div>

            {/* Current role badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="shimmer-card inline-block mb-8"
              style={{
                background: "linear-gradient(135deg, rgba(0,240,255,0.08), rgba(255,46,151,0.08))",
                border: "1px solid var(--accent-cyan)",
                padding: "1rem 1.5rem",
              }}
            >
              <p className="text-xs mb-1" style={{ color: "var(--accent-pink)", fontFamily: "'Fira Code', monospace" }}>
                ● CURRENTLY AT
              </p>
              <p className="font-orbitron font-bold text-sm" style={{ color: "var(--accent-cyan)" }}>
                AI Tech Solutions Ltd.
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                Agentic AI · Multi-Agent Orchestration · RAG Architecture
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="card px-5 py-3 text-center"
                  style={{ minWidth: "110px" }}
                >
                  <span
                    className="block font-orbitron font-bold"
                    style={{ fontSize: "1.75rem", color: "var(--accent-cyan)" }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-xs uppercase tracking-widest"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap gap-4"
            >
              <a href="#projects" className="btn-cyber btn-primary-cyber">
                View Projects
              </a>
              <button onClick={() => setShowModal(true)} className="btn-cyber btn-secondary-cyber">
                Get Resume
              </button>
              <a
                href="mailto:rohan.dhanraj.y@gmail.com"
                className="btn-cyber btn-ghost-cyber"
              >
                Hire Me
              </a>
            </motion.div>
          </div>

          {/* ── Right: Profile Visual ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 80 }}
            className="hidden lg:flex flex-col items-center gap-6"
          >
            {/* Avatar circle */}
            <div className="relative" style={{ width: 280, height: 280 }}>
              {/* Rotating gradient ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "conic-gradient(from 0deg, #00f0ff, #ff2e97, #a855f7, #00f0ff)",
                  animation: "rotate360 6s linear infinite",
                  padding: "3px",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{ inset: "3px", background: "var(--bg-primary)" }}
              />
              {/* Profile Image */}
              <img
                src="/profile.png"
                alt="Profile photo"
                className="absolute rounded-full object-cover"
                style={{
                  inset: "8px",
                  width: "calc(100% - 16px)",
                  height: "calc(100% - 16px)",
                  border: "3px solid rgba(0,240,255,0.3)",
                  background: "var(--bg-card)",
                  zIndex: 2,
                }}
              />
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: "0 0 60px rgba(0,240,255,0.25)", borderRadius: "50%" }}
              />
            </div>

            {/* Quick info badges */}
            <div className="flex flex-col gap-2 w-full">
              {[
                { icon: "📍", text: "Bengaluru, India" },
                { icon: "🎓", text: "GATE Qualified BE" },
                { icon: "💼", text: "Open to Opportunities" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 px-4 py-2 text-xs"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <ModalPortal>
        <AnimatePresence>
          {showModal && <ResumeModal onClose={() => setShowModal(false)} />}
        </AnimatePresence>
      </ModalPortal>
    </section>
  );
}
