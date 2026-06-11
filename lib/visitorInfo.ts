// Visitor information capture — runs client-side
// Fetches IP, geolocation, and timezone from ipapi.co (free tier: 1000 req/day)
// Caches result for the session to avoid repeated API calls.

import { VisitorInfo } from "./types";

let cachedVisitor: VisitorInfo | null = null;

const FALLBACK_VISITOR: VisitorInfo = {
  ip: "unknown",
  country: "unknown",
  city: "unknown",
  region: "unknown",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
  userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
};

/**
 * Captures visitor IP, geolocation, and timezone.
 * Uses ipapi.co free API (no key needed, 1000 req/day).
 * Result is cached for the entire browser session.
 */
export async function getVisitorInfo(): Promise<VisitorInfo> {
  if (cachedVisitor) return cachedVisitor;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("https://ipapi.co/json/", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`ipapi returned ${res.status}`);

    const data = await res.json();

    cachedVisitor = {
      ip: data.ip || "unknown",
      country: data.country_name || "unknown",
      city: data.city || "unknown",
      region: data.region || "unknown",
      timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      userAgent: navigator.userAgent,
    };

    return cachedVisitor;
  } catch (err) {
    console.warn("Could not fetch visitor info:", err);
    cachedVisitor = {
      ...FALLBACK_VISITOR,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    };
    return cachedVisitor;
  }
}
