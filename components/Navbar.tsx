"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(10, 14, 26, 0.9)"
            : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
        }}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <a
            href="#hero"
            className="font-orbitron font-black text-lg tracking-wider"
            style={{ color: "var(--accent-cyan)", textDecoration: "none" }}
          >
            RDY
            <span
              className="animate-blink ml-0.5"
              style={{ color: "var(--accent-pink)" }}
            >
              _
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="font-fira text-xs uppercase tracking-widest transition-colors duration-200"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--accent-cyan)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                {item.label}
              </a>
            ))}

            <a
              href="/resumes/ats_resume.pdf"
              download
              className="btn-cyber btn-primary-cyber text-xs py-2 px-4"
              style={{ fontSize: "0.7rem" }}
            >
              Resume ↓
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
          >
            <span
              className="block w-6 h-0.5 transition-all duration-300 origin-center"
              style={{
                background: "var(--accent-cyan)",
                transform: mobileOpen ? "rotate(45deg) translate(3px, 3px)" : "none",
              }}
            />
            <span
              className="block w-6 h-0.5 transition-all duration-300"
              style={{
                background: "var(--accent-cyan)",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-6 h-0.5 transition-all duration-300 origin-center"
              style={{
                background: "var(--accent-cyan)",
                transform: mobileOpen ? "rotate(-45deg) translate(3px, -3px)" : "none",
              }}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden flex flex-col gap-4 px-6 py-6"
            style={{
              background: "rgba(10, 14, 26, 0.97)",
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="font-fira text-sm uppercase tracking-widest"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/resumes/ats_resume.pdf"
              download
              className="btn-cyber btn-primary-cyber text-xs py-2 px-4 inline-block"
              style={{ width: "fit-content" }}
            >
              Resume ↓
            </a>
          </motion.div>
        )}
      </motion.nav>
    </>
  );
}
