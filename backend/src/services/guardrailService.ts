export function isPromptInjection(query: string): boolean {
  const normalized = query.toLowerCase();

  // Basic prompt injection phrases
  const injectionPhrases = [
    "ignore previous instructions",
    "ignore the instructions",
    "forget all instructions",
    "system prompt",
    "override",
    "bypass",
    "jailbreak",
    "you are now a",
    "act as",
    "new instructions",
    "ignore rules",
    "forget previous prompt"
  ];

  for (const phrase of injectionPhrases) {
    if (normalized.includes(phrase)) {
      return true;
    }
  }

  // Look for attempts to print the system prompt or retrieve instructions
  const dumpPhrases = [
    "output the prompt",
    "show the system prompt",
    "reveal the system prompt",
    "reveal your instructions",
    "print the above",
    "repeat the system prompt",
    "what is your system prompt"
  ];

  for (const phrase of dumpPhrases) {
    if (normalized.includes(phrase)) {
      return true;
    }
  }

  return false;
}

export function isRefusalPattern(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return (
    lower.startsWith("unsafe") ||
    lower.includes("unsafe content") ||
    lower.includes("cannot fulfill") ||
    lower.includes("unable to answer") ||
    lower.includes("violates") ||
    lower.includes("safety guidelines") ||
    lower.includes("content moderation") ||
    lower.includes("i'm sorry, but") ||
    lower.includes("i am sorry, but") ||
    lower.includes("as an ai") ||
    lower.includes("as a large language") ||
    lower.includes("inappropriate") ||
    lower.startsWith("sorry") ||
    lower.startsWith("i cannot") ||
    lower.startsWith("i am unable")
  );
}

export const SAFE_FALLBACK_RESPONSE = "I am only authorized to discuss Rohan Yadav's professional career, skills, projects, and credentials. Feel free to contact him directly at rohan.dhanraj.y@gmail.com.";

// PRE-AGENT (Input) rules
const PRE_AGENT_PATTERNS = [
  /ignore\s+previous\s+instructions/gi,
  /ignore\s+the\s+instructions/gi,
  /forget\s+all\s+instructions/gi
];

export function validatePreAgentInput(query: string): void {
  // 1. Check override attempts
  for (const pattern of PRE_AGENT_PATTERNS) {
    if (pattern.test(query)) {
      throw new Error("Malicious system override attempt detected.");
    }
  }

  // 2. Check existing prompt injection helper
  if (isPromptInjection(query)) {
    throw new Error("Malicious prompt injection detected.");
  }
}

// POST-AGENT (Output) rules
export interface PostAgentRule {
  name: string;
  pattern: RegExp;
  strategy: "redact" | "mask";
}

export const POST_AGENT_RULES: PostAgentRule[] = [
  {
    name: "System Prompt Reveal",
    pattern: /(system\s+prompt|systemPrompt)/gi,
    strategy: "redact"
  },
  {
    name: "AI Refusals & Disclaimers",
    pattern: /(unsafe\s+content|cannot\s+fulfill|unable\s+to\s+answer|safety\s+guidelines|content\s+moderation|i'm\s+sorry,\s+but|i\s+am\s+sorry,\s+but|as\s+an\s+ai|as\s+a\s+large\s+language|sorry,\s+i\s+cannot|i\s+cannot\s+fulfill)/gi,
    strategy: "redact"
  },
  {
    name: "OpenRouter API Key",
    pattern: /sk-or-v1-[a-f0-9]{64}/gi,
    strategy: "redact"
  },
  {
    name: "Nvidia API Key",
    pattern: /nvapi-[A-Za-z0-9_-]+/g,
    strategy: "redact"
  },
  {
    name: "DB Credentials",
    pattern: /(65e91c359c810bdd9bd4980e012d239fb7ad6055|e1b576e93e20032f9f24b65c58b7b1ec858c825a|ffb7695e0339536f32e7c4d0e2751655f21a71f66a3aa9502efc2465dd3eadc9)/g,
    strategy: "mask"
  }
];

export function censorPostAgentOutput(text: string): string {
  let censored = text;
  for (const rule of POST_AGENT_RULES) {
    censored = censored.replace(rule.pattern, (match) => {
      if (rule.strategy === "mask") {
        return "*".repeat(match.length);
      }
      return "****";
    });
  }
  return censored;
}

export class StreamCensor {
  private rawText = "";
  private sentText = "";
  private maxBufferedWords = 5;

  public append(token: string, isFinal = false): string {
    this.rawText += token;
    const censoredText = censorPostAgentOutput(this.rawText);

    if (isFinal) {
      const toSend = censoredText.slice(this.sentText.length);
      this.sentText = censoredText;
      return toSend;
    }

    // Split text keeping spaces to preserve formatting
    const words = censoredText.split(/(\s+)/);
    
    let wordCount = 0;
    let splitIndex = 0;

    // Scan backwards to keep the last 5 completed words in the lookahead buffer
    for (let i = words.length - 1; i >= 0; i--) {
      if (words[i].trim().length > 0) {
        wordCount++;
        if (wordCount > this.maxBufferedWords) {
          const unsafePart = words.slice(i + 1).join("");
          splitIndex = censoredText.length - unsafePart.length;
          break;
        }
      }
    }

    if (splitIndex > this.sentText.length) {
      const toSend = censoredText.slice(this.sentText.length, splitIndex);
      this.sentText = censoredText.slice(0, splitIndex);
      return toSend;
    }

    return "";
  }
}
