import dotenv from "dotenv";
import { isRefusalPattern, SAFE_FALLBACK_RESPONSE } from "./guardrailService.js";

dotenv.config();

export async function streamNvidiaNimResponse(
  query: string,
  context: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  res: any
): Promise<void> {
  const apiKey = process.env.NVIDIA_NIM_API_KEY;
  const model = process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-70b-instruct";
  const baseUrl = process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1/chat/completions";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!apiKey || apiKey === "mock-key") {
    const mockResponseText = `Based on the context, Rohan Yadav is an AI/ML Engineer with 7+ years of experience, including work on OMODORE and SALESMOJI.`;
    const words = mockResponseText.split(" ");
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: word + " " } }] })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 20));
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

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 512
    })
  });

  if (!response.ok) {
    throw new Error(`NVIDIA NIM API failed: ${response.status} ${response.statusText}`);
  }

  const reader = response.body ? response.body.getReader() : null;
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("Response body is not readable");
  }

  let buffer = "";
  let accumulatedText = "";
  let checkPassed = false;
  const bufferLimit = 150; // Buffer first 150 characters to run output guardrail check

  const streamFallback = async () => {
    const words = SAFE_FALLBACK_RESPONSE.split(" ");
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: word + " " } }] })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const content = parsed.choices?.[0]?.delta?.content || "";
          accumulatedText += content;

          if (!checkPassed && accumulatedText.length >= bufferLimit) {
            if (isRefusalPattern(accumulatedText)) {
              console.warn("Output refusal intercepted by guardrails. Triggering fallback.");
              await streamFallback();
              return;
            }
            checkPassed = true;
            // Write the accumulated buffer out
            res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: accumulatedText } }] })}\n\n`);
          } else if (checkPassed) {
            res.write(`${line}\n\n`);
          }
        } catch {
          // Pass-through any unparseable line if check already passed
          if (checkPassed) {
            res.write(`${line}\n\n`);
          }
        }
      }
    }
  }

  // If response ended before reaching the bufferLimit, check it now
  if (!checkPassed) {
    if (isRefusalPattern(accumulatedText)) {
      console.warn("Output refusal intercepted at stream end.");
      await streamFallback();
      return;
    }
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: accumulatedText } }] })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
}
