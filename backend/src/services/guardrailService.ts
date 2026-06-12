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
