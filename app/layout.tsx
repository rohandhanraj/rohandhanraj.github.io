import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rohan Dhanraj Yadav — Senior AI/ML Engineer",
  description:
    "Portfolio of Rohan Dhanraj Yadav — Senior AI/ML Engineer & Generative AI Specialist with 4+ years building production-grade LLM, RAG, and Agentic AI systems for Fortune 500 clients.",
  keywords: [
    "Rohan Dhanraj Yadav",
    "AI Engineer",
    "ML Engineer",
    "Generative AI",
    "LangChain",
    "RAG",
    "LLM",
    "FastAPI",
    "Python",
    "Agentic AI",
  ],
  authors: [{ name: "Rohan Dhanraj Yadav", url: "https://rohandhanraj.github.io" }],
  openGraph: {
    title: "Rohan Dhanraj Yadav — Senior AI/ML Engineer",
    description:
      "AI Engineer specializing in Generative AI, RAG systems, and Agentic AI. 4+ years building for Fortune 500 clients.",
    url: "https://rohandhanraj.github.io",
    siteName: "Rohan Dhanraj Yadav Portfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@rdx2496",
    title: "Rohan Dhanraj Yadav — Senior AI/ML Engineer",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning={true}>
      <body className="antialiased" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
