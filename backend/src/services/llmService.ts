import "../config/env.js";
import axios from "axios";
import { StreamCensor } from "./guardrailService.js";
import { RetrievalResult } from "./ragService.js";

export function buildSystemPrompt(context: string): string {
  return `You are an assistant acting as a "Digital Twin", representing Rohan Dhanraj Yadav on Rohan's website, and engaging with visitors.

Your goal is to answer questions acting as Rohan (using first person: "I", "me", "my"), strictly adhering to the verified facts provided below without generating anything out of creativity.

Rohan Dhanraj Yadav is a Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient. He specializes in Generative AI, Agentic AI, MCP tools, and production LLM engineering.

CONTEXT — Use the key-based factual entries below to answer:
${context}

GROUNDING & PERSONALIZATION RULES:
1. STRICT FACTUAL ADHERENCE & ZERO CREATIVE FABRICATION:
   - Answer strictly and exclusively from the verified facts provided in CONTEXT.
   - Do NOT invent, assume, embellish, or extrapolate facts, timelines, job duties, metrics, clients, or technologies out of creativity.
   - Never generate unverified claims or creative background stories. If a detail is not in the context, do not speculate or extrapolate.
2. EXACT TENURE & TIMELINE ACCURACY:
   - State job and project tenures precisely based on the start and end dates in the context.
   - Never describe a short tenure as "several years", "many years", or "long-term".
   - Specifically: R Systems International (Client: Lendistry) was from June 2026 to September 2026 (~3-4 months). Never say or imply you worked there for "several years".
   - Overall career limits: strictly cite 'years_experience': 7+ years of total professional experience, 4+ years of AI/ML engineering, 2+ years of Generative AI, and 1+ year of Agentic AI.
   - Never claim or imply 7+ years or "several years" in Generative AI or Agentic AI (including Harness Engineering or Agentic Ops).
3. ROLES & RELATIONSHIPS:
   - Current Role: Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient (September 2026 – Present).
   - Previous Role: Senior AI/ML Engineer at R Systems International (Client: Lendistry, June 2026 – September 2026).
   - Note: Lendistry is a CLIENT, not an employer or project.
   - For skills, refer directly to 'specialties' and relevant project 'skills_used'.
   - For projects, refer to the project's responsibilities, domain, client, and impact.
4. FIRST PERSON CONVERSATIONAL PERSONA:
   - Answer naturally, conversationally, and engagingly in the first person ("I", "my", "me") as Rohan's Digital Twin.
   - NEVER start responses with formulaic, repetitive robotic phrases like "I am Rohan's Digital Twin. Based on my experience and records:" or "Based on my verified records:".
   - Dive directly into answering the visitor's question in a warm, professional, conversational voice.
5. GREETINGS & CASUAL QUESTIONS:
   - If the visitor offers a simple greeting (e.g. "hi", "hello", "hey", "who are you?"), reply conversationally in 1-2 friendly sentences introducing yourself and asking what they would like to know.
   - Do NOT dump a full resume, long biography, or unsolicited project summary on greetings.
6. PROPORTIONALITY & PRECISION:
   - Keep answers concise for brief queries, and detailed only when specifically requested.
   - Highlight exact metrics and achievements when relevant, and mention relevant projects where I applied specific technologies.
7. MISSING INFORMATION BACKSTOP:
   - If the context does not contain the answer, say: "I don't have that specific detail in my records, but feel free to reach out to me directly at rohan.dhanraj.y@gmail.com or on LinkedIn: https://www.linkedin.com/in/rohan-dhanraj-yadav"`;
}

export function generateMockResponse(query: string, context: string): string {
  const normalized = query.trim().toLowerCase().replace(/[?!.,]/g, "");
  const greetings = [
    "hi",
    "hello",
    "hey",
    "who are you",
    "greetings",
    "good morning",
    "good afternoon",
    "good evening",
    "hey there"
  ];
  const isGreeting = greetings.includes(normalized) || /^(hi|hello|hey)\b/i.test(query.trim());

  if (isGreeting) {
    return "Hi! I am Rohan's Digital Twin. Welcome to my portfolio! What would you like to know about my experience, skills, or projects?";
  }

  const cleanContext = (context || "").trim();
  if (!cleanContext) {
    return "I am Rohan Dhanraj Yadav, Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient with 7+ years of total professional experience, including 4+ years in AI/ML, 2+ years in Generative AI, and 1+ year in Agentic AI. Feel free to ask me anything about my work!";
  }

  const queryLower = query.toLowerCase();
  const isAgenticQuery = /agentic/i.test(queryLower);
  const isProjectQuery = /\b(projects?|portfolio|built|apps?|applications?)\b/i.test(queryLower);
  const isTenureQuery = /years?(?:\s+of)?\s+experience|how\s+many\s+years|total\s+(?:years|experience)|tenure/i.test(queryLower);
  const isSkillQuery = /\b(tech stack|skills|specialties|technologies|tools|languages|frameworks)\b/i.test(queryLower);

  // 1. Projects Conversational Response
  if (/### Project:/i.test(cleanContext) || (isProjectQuery && cleanContext.includes("- **Domain**:"))) {
    const rawBlocks = cleanContext.split(/(?=### Project:)/i);
    const projectBlocks = rawBlocks.filter(b => /### Project:/i.test(b));

    if (projectBlocks.length > 0) {
      const intro = isAgenticQuery
        ? "Here are the key projects where I've built and engineered Agentic AI solutions and autonomous systems:"
        : "Here are the key projects highlighting my engineering work and impact:";

      const formattedProjects = projectBlocks.map(block => {
        const nameMatch = block.match(/### Project:\s*([^\n]+)/i);
        const name = nameMatch ? nameMatch[1].trim() : "Project";

        const domainMatch = block.match(/- \*\*Domain\*\*:\s*([^\n]+)/i);
        const domain = domainMatch ? domainMatch[1].trim() : "";

        const clientMatch = block.match(/- \*\*Client\*\*:\s*([^\n]+)/i);
        const client = clientMatch ? clientMatch[1].trim() : "";

        const descMatch = block.match(/- \*\*Description\*\*:\s*([^\n]+)/i);
        const desc = descMatch ? descMatch[1].trim() : "";

        const skillsMatch = block.match(/- \*\*Skills Used\*\*:\s*([^\n]+)/i);
        const skills = skillsMatch ? skillsMatch[1].trim() : "";

        let entry = `- **${name}**${domain ? ` (${domain}${client ? ` | Client: ${client}` : ""})` : ""}: ${desc}`;
        if (skills) {
          entry += `\n  - *Tech Stack*: ${skills}`;
        }
        return entry;
      });

      return `${intro}\n\n${formattedProjects.join("\n\n")}\n\nFeel free to ask if you would like me to dive deeper into the technical architecture or deliverables for any of these!`;
    }
  }

  // 2. Years of Experience / Tenure Conversational Response
  if (isTenureQuery || /### Experience Summary/i.test(cleanContext)) {
    return `I have over 7 years of total professional engineering experience, including:
- **Generative AI & LLMs**: 2+ years of production experience (RAG architectures, LLM fine-tuning, vector & graph databases).
- **Agentic AI & Multi-Agent Systems**: 1+ year engineering autonomous agent workflows, LangGraph orchestration, MCP tools, and safety guardrails.
- **AI / Machine Learning**: 4+ years building high-scale ML pipelines, deep learning models, and NLP systems.

Currently, I serve as a **Senior Associate Data Science L2 — Delivery, Engineering at Publicis Sapient** (September 2026 – Present). Prior to this, I was a Senior AI/ML Engineer at **R Systems International** from June 2026 to September 2026 (~3-4 months) engineering Agentic AI workflows for our client, **Lendistry**.`;
  }

  // 3. Technical Specialties / Skills Conversational Response
  if (/### Technical Specialties/i.test(cleanContext) || isSkillQuery) {
    const specialtyLines = cleanContext
      .split("\n")
      .filter(l => l.trim().startsWith("- **"))
      .join("\n");

    if (specialtyLines) {
      return `Here is an overview of my core technical specialties and skills:\n\n${specialtyLines}\n\nI apply these tools across production LLM systems, agent orchestration, and enterprise data science pipelines. Is there a specific technology or use-case you'd like to explore?`;
    }
  }

  // 4. Experience / Company Conversational Response
  if (/### Professional Experience:/i.test(cleanContext)) {
    const expBlocks = cleanContext.split(/(?=### Professional Experience:)/i).filter(b => /### Professional Experience:/i.test(b));
    if (expBlocks.length > 0) {
      const formattedExp = expBlocks.map(block => {
        const compMatch = block.match(/### Professional Experience:\s*([^\n]+)/i);
        const company = compMatch ? compMatch[1].trim() : "Company";

        const roleMatch = block.match(/- \*\*Role & Title\*\*:\s*([^\n]+)/i);
        const role = roleMatch ? roleMatch[1].trim() : "";

        const durMatch = block.match(/- \*\*Duration\*\*:\s*([^\n]+)/i);
        const dur = durMatch ? durMatch[1].trim() : "";

        const clientMatch = block.match(/- \*\*Client\*\*:\s*([^\n]+)/i);
        const client = clientMatch ? clientMatch[1].trim() : "";

        const skillsMatch = block.match(/- \*\*Skills Used\*\*:\s*([^\n]+)/i);
        const skills = skillsMatch ? skillsMatch[1].trim() : "";

        let entry = `### ${company}\n- **Role**: ${role} (${dur})${client ? `\n- **Client**: ${client}` : ""}`;
        if (skills) {
          entry += `\n- **Skills Used**: ${skills}`;
        }
        return entry;
      });

      return `Here is a summary of my professional experience:\n\n${formattedExp.join("\n\n---\n\n")}\n\nFeel free to ask about any specific project, technology, or client engagement!`;
    }
  }

  // 5. Clean Conversational Fallback without rigid robotic headers
  const cleanedExcerpt = cleanContext
    .replace(/^### Identity & Profile Overview\s*/gim, "")
    .replace(/^### Identity & Current Role\s*/gim, "")
    .trim();

  return `Here are the details regarding your inquiry:\n\n${cleanedExcerpt}`;
}

export async function streamNvidiaNimResponse(
  query: string,
  contextOrResult: string | RetrievalResult,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  res: any
): Promise<void> {
  let context = "";
  let retrievalLog = "";

  if (typeof contextOrResult === "string") {
    context = contextOrResult;
    retrievalLog = "- **Context Source**: Retrieved profile context nodes.";
  } else {
    context = contextOrResult.context;
    retrievalLog = contextOrResult.retrievalLog;
  }

  const apiKey = process.env.NVIDIA_NIM_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim() || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY?.trim();
  const model = process.env.NVIDIA_NIM_MODEL?.trim() || process.env.OPENROUTER_MODEL?.trim() || process.env.NEXT_PUBLIC_OPENROUTER_MODEL?.trim() || "meta/llama-3.1-70b-instruct";
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL?.trim() || process.env.OPENROUTER_BASE_URL?.trim() || process.env.NEXT_PUBLIC_OPENROUTER_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1/chat/completions";

  if (res.setHeader && !res.headersSent) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  }

  const censor = new StreamCensor();

  // Always stream detailed reasoning & graph node traversal header into the thinking palette
  const thinkingHeader = `<think>\n### 🧠 Query Reasoning & Strategy\n- **User Query**: "${query}"\n\n🔍 **Graph Knowledge & Retrieval Traversal**:\n${retrievalLog}\n\n🤖 **Model Reasoning & Synthesis**:\nProcessing retrieved context nodes and synthesizing complete response...\n`;

  let hasThinkStarted = true;
  let hasThinkEnded = false;

  const headerWords = thinkingHeader.split(" ");
  for (const word of headerWords) {
    const chunk = word + " ";
    const safe = censor.append(chunk);
    if (safe) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 8));
  }

  if (!apiKey || apiKey === "mock-key") {
    // End thinking process before streaming mock / fallback response
    const endThinkChunk = "</think>\n\n";
    const safeEndThink = censor.append(endThinkChunk);
    if (safeEndThink) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safeEndThink } }] })}\n\n`);
    }
    hasThinkEnded = true;

    // Generate dynamic response from retrieved context without any arbitrary truncation
    const mockResponseText = generateMockResponse(query, context);
    const words = mockResponseText.split(" ");
    for (const word of words) {
      const chunk = word + " ";
      const safe = censor.append(chunk);
      if (safe) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    const final = censor.append("", true);
    if (final) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: final } }] })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const systemPrompt = buildSystemPrompt(context);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: query }
  ];

  let invokeUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;
  if (apiKey.startsWith("sk-or-v1-")) {
    invokeUrl = "https://openrouter.ai/api/v1/chat/completions";
  }

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Accept": "text/event-stream"
  };

  const temperature = process.env.LLM_TEMPERATURE !== undefined ? parseFloat(process.env.LLM_TEMPERATURE) : 0.1;
  const top_p = process.env.LLM_TOP_P !== undefined ? parseFloat(process.env.LLM_TOP_P) : 0.1;

  const payload = {
    model,
    messages,
    stream: true,
    temperature,
    top_p,
    max_tokens: 4096
  };

  try {
    const response = await axios.post(invokeUrl, payload, {
      headers,
      responseType: "stream",
      timeout: 15000
    });

    const stream = response.data;
    let buffer = "";

    return new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;

          if (trimmed.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const reasoning = parsed.choices?.[0]?.delta?.reasoning_content || "";
              const content = parsed.choices?.[0]?.delta?.content || "";

              let chunkToProcess = "";
              if (reasoning) {
                chunkToProcess += reasoning;
              } else if (content) {
                if (hasThinkStarted && !hasThinkEnded) {
                  hasThinkEnded = true;
                  chunkToProcess += "</think>\n\n";
                }
                chunkToProcess += content;
              }

              if (chunkToProcess) {
                const safe = censor.append(chunkToProcess);
                if (safe) {
                  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
                }
              }
            } catch {}
          }
        }
      });

      stream.on("end", () => {
        let endChunk = "";
        if (hasThinkStarted && !hasThinkEnded) {
          endChunk += "</think>\n\n";
        }
        const finalContent = censor.append(endChunk, true);
        if (finalContent) {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: finalContent } }] })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        res.end();
        resolve();
      });

      stream.on("error", (err: any) => {
        reject(err);
      });
    });
  } catch (err: any) {
    console.error("LLM Streaming failed, falling back to local context response:", err?.message || err);
    if (hasThinkStarted && !hasThinkEnded) {
      hasThinkEnded = true;
      const endThinkChunk = "</think>\n\n";
      const safeEnd = censor.append(endThinkChunk);
      if (safeEnd) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safeEnd } }] })}\n\n`);
      }
    }

    const mockResponseText = generateMockResponse(query, context);
    
    const words = mockResponseText.split(" ");
    for (const word of words) {
      const chunk = word + " ";
      const safe = censor.append(chunk);
      if (safe) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    const final = censor.append("", true);
    if (final) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: final } }] })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
