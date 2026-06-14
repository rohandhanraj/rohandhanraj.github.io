import "../config/env.js";
import axios from "axios";
import { StreamCensor, SAFE_FALLBACK_RESPONSE } from "./guardrailService.js";

export async function streamNvidiaNimResponse(
  query: string,
  context: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  res: any
): Promise<void> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY?.trim();
  const model = process.env.NVIDIA_NIM_MODEL?.trim() || "meta/llama-3.1-70b-instruct";
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL?.trim() || "https://integrate.api.nvidia.com/v1/chat/completions";

  if (res.setHeader && !res.headersSent) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  }

  const censor = new StreamCensor();

  if (!apiKey || apiKey === "mock-key") {
    // Generate reasoning + response in mock response block
    const mockResponseText = `<think>\nAnalyzing prompt for query: "${query}"...\nRetrieving relevant information.\n</think>\nBased on the context, Rohan Yadav is an AI/ML Engineer with 7+ years of experience, including work on OMODORE and SALESMOJI.`;
    const words = mockResponseText.split(" ");
    for (const word of words) {
      const chunk = word + " ";
      const safe = censor.append(chunk);
      if (safe) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: safe } }] })}\n\n`);
      }
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    const final = censor.append("", true);
    if (final) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: final } }] })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  const systemPrompt = `You are Rohan Dhanraj Yadav's intelligent portfolio assistant. Your job is to answer visitor questions about Rohan accurately and engagingly.

CONTEXT — Use ONLY the information below to answer:
${context}

RULES:
1. Answer ONLY based on the context provided above.
2. If the context doesn't contain the answer, say: "I don't have that specific detail, but feel free to reach Rohan directly at rohan.dhanraj.y@gmail.com or connect on LinkedIn: https://www.linkedin.com/in/rohan-dhanraj-yadav"
3. Be friendly, professional, and concise.
4. Refer to Rohan in third person (he, him, his).
5. Highlight specific metrics and achievements when relevant (e.g., 45% accuracy boost, 10K+ daily queries).
6. For project questions, mention the tech stack and key impact.
7. Keep responses under 200 words unless a detailed breakdown is explicitly needed.
8. Format lists with bullet points when appropriate.
9. Distinguish carefully between experience durations: Rohan has 7+ years of total professional experience, 4+ years of AI/ML engineering experience, 3 years of Generative AI experience, and 1.5 years of Agentic AI experience. Do not state or imply he has 7+ years of experience in Generative AI or Agentic AI.
10. When queried about experience with a specific technology, framework, or tech stack, mention all the relevant projects from the context where Rohan applied that technology.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-8),
    { role: "user", content: query }
  ];

  const invokeUrl = baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`;

  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Accept": "text/event-stream"
  };

  const payload = {
    model,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 512
  };

  try {
    const response = await axios.post(invokeUrl, payload, {
      headers,
      responseType: "stream"
    });

    const stream = response.data;
    let buffer = "";
    let hasThinkStarted = false;
    let hasThinkEnded = false;

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
                if (!hasThinkStarted) {
                  hasThinkStarted = true;
                  chunkToProcess += "<think>";
                }
                chunkToProcess += reasoning;
              } else if (content) {
                if (hasThinkStarted && !hasThinkEnded) {
                  hasThinkEnded = true;
                  chunkToProcess += "</think>";
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
          endChunk += "</think>";
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
    if (err.response) {
      console.error(`NVIDIA NIM API HTTP error ${err.response.status}`);
      if (err.response.data && typeof err.response.data.on === "function") {
        let errBody = "";
        err.response.data.on("data", (chunk: Buffer) => {
          errBody += chunk.toString();
        });
        await new Promise<void>((resolve) => {
          err.response.data.on("end", () => {
            console.error("NVIDIA error response body:", errBody);
            resolve();
          });
        });
      } else {
        console.error(err.response.data);
      }
      throw new Error(`NVIDIA NIM API failed with status ${err.response.status}`);
    } else {
      throw err;
    }
  }
}
