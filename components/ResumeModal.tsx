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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: "rgba(10,10,20,0.85)" }}
      />
      
      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl bg-black rounded-lg border border-[#00f0ff40] shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col overflow-hidden"
        style={{ height: "85vh", maxHeight: "800px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#00f0ff20] bg-[#0a0a14]">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#050508] relative">
          {!selected ? (
            <div className="p-8 grid gap-4 place-content-center h-full max-w-2xl mx-auto">
              {(Object.keys(RESUMES) as ResumeType[]).map((key) => {
                const r = RESUMES[key!];
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className="flex flex-col text-left p-6 rounded-lg border border-[#00f0ff20] hover:border-[#00f0ff] hover:bg-[#00f0ff0a] transition-all group"
                  >
                    <span className="font-orbitron font-bold text-xl text-white group-hover:text-[#00f0ff] mb-2">{r.title}</span>
                    <span className="text-sm text-gray-400 leading-relaxed font-fira">{r.desc}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden relative">
                {RESUMES[selected].type === "html" ? (
                  <iframe src={RESUMES[selected].file} className="w-full h-full border-0" title={RESUMES[selected].title} />
                ) : (
                  <div className="absolute inset-0 bg-white">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full text-gray-500 font-fira">Loading...</div>
                    ) : (
                      <iframe srcDoc={content} className="w-full h-full border-0" title={RESUMES[selected].title} />
                    )}
                  </div>
                )}
              </div>
              {/* Footer with Download */}
              <div className="p-4 border-t border-[#00f0ff20] bg-[#0a0a14] flex justify-end">
                <a 
                  href={RESUMES[selected].pdf}
                  download
                  className="bg-[#00f0ff] text-black px-6 py-3 rounded font-orbitron font-bold hover:bg-white transition-colors uppercase tracking-wider text-sm flex items-center gap-2"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
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
