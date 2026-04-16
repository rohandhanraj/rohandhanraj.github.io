"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { marked } from "marked";

type ResumeType = "ats" | "optimized" | "master" | null;

const RESUMES = {
  ats: {
    title: "ATS Resume",
    desc: "Clean, structured format optimized for Applicant Tracking Systems.",
    file: "/resumes/detailed_resume.md",
    pdf: "/resumes/ats_resume.pdf",
    type: "md"
  },
  optimized: {
    title: "Optimized Resume",
    desc: "Concise, high-impact version for quick screening.",
    file: "/resumes/optimized_resume.md",
    pdf: "/resumes/optimized_resume.pdf",
    type: "md"
  },
  master: {
    title: "Master CV",
    desc: "Comprehensive detailing with full experience, projects, and custom styling.",
    file: "/resumes/master_cv.html",
    pdf: "/resumes/master_cv.pdf",
    type: "html"
  }
};

export default function ResumeModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<ResumeType>(null);
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selected) {
      if (RESUMES[selected].type === "md") {
        setIsLoading(true);
        fetch(RESUMES[selected].file)
          .then(r => r.text())
          .then(text => {
            setContent(marked.parse(text) as string);
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      }
    }
  }, [selected]);

  // Lock body + html scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    /* Outer portal shell — fixed, full-viewport, highest stacking context */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

      {/* Backdrop — also fixed so it always covers the viewport independently */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(5,5,14,0.97)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      />

      {/* Modal box — sits above backdrop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{ zIndex: 9999, height: "85vh", maxHeight: "800px" }}
        className="relative w-full max-w-4xl bg-black rounded-lg border border-[#00f0ff40] shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-none flex items-center justify-between p-4 border-b border-[#00f0ff20] bg-[#0a0a14]">
          <h2 className="font-orbitron font-bold text-lg text-[#00f0ff]">
            {selected ? RESUMES[selected].title : "Select Resume Version"}
          </h2>
          <div className="flex gap-3 items-center">
            {selected && (
              <button
                onClick={() => setSelected(null)}
                className="text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                title="Back to options"
              >
                ← Back
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              title="Close modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Area — flex-1 + overflow-hidden so children can use absolute inset-0 */}
        <div className="relative flex-1 overflow-hidden bg-[#050508]">
          {!selected ? (
            /* Selection screen — scrollable list of options */
            <div className="absolute inset-0 overflow-y-auto">
              <div className="p-8 grid gap-4 place-content-center min-h-full max-w-2xl mx-auto">
                {(Object.keys(RESUMES) as ResumeType[]).map((key) => {
                  const r = RESUMES[key!];
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(key)}
                      className="flex flex-col text-left p-6 rounded-lg border border-[#00f0ff20] hover:border-[#00f0ff] hover:bg-[#00f0ff0a] transition-all group"
                    >
                      <span className="font-orbitron font-bold text-xl text-white group-hover:text-[#00f0ff] mb-2">
                        {r.title}
                      </span>
                      <span className="text-sm text-gray-400 leading-relaxed font-fira">
                        {r.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Resume viewer — pinned to the content area via absolute inset-0 */
            <div className="absolute inset-0 flex flex-col">

              {/* Document area fills all remaining height */}
              <div className="relative flex-1 overflow-hidden">
                {RESUMES[selected].type === "html" ? (
                  /* HTML resume (Master CV) */
                  <div className="absolute inset-0">
                    <iframe
                      src={RESUMES[selected].file}
                      className="w-full h-full border-0"
                      title={RESUMES[selected].title}
                    />
                  </div>
                ) : (
                  /* Markdown resumes (ATS / Optimized) */
                  <div className="absolute inset-0 bg-white">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full text-gray-500 font-fira">
                        Loading…
                      </div>
                    ) : (
                      <iframe
                        srcDoc={content}
                        className="w-full h-full border-0"
                        title={RESUMES[selected].title}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Download footer */}
              <div className="flex-none p-4 border-t border-[#00f0ff20] bg-[#0a0a14] flex justify-end">
                <a
                  href={RESUMES[selected].pdf}
                  download
                  className="bg-[#00f0ff] text-black px-6 py-3 rounded font-orbitron font-bold hover:bg-white transition-colors uppercase tracking-wider text-sm flex items-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  Download final PDF
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
