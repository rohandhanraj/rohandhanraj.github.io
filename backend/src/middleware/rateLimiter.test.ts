import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { chatRateLimiter } from "./rateLimiter.js";

function buildTestApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.get("/test", chatRateLimiter, (req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe("chatRateLimiter", () => {
  it("should allow requests up to the limit", async () => {
    const app = buildTestApp();
    for (let i = 0; i < 10; i++) {
      const res = await request(app).get("/test").set("X-Forwarded-For", "203.0.113.1");
      expect(res.status).toBe(200);
    }
  });

  it("should reject the 11th request from the same IP with a custom message", async () => {
    const app = buildTestApp();
    for (let i = 0; i < 10; i++) {
      await request(app).get("/test").set("X-Forwarded-For", "203.0.113.2");
    }
    const res = await request(app).get("/test").set("X-Forwarded-For", "203.0.113.2");

    expect(res.status).toBe(429);
    expect(res.body.error).toBe("You've reached the chat message limit. Please wait a minute and try again.");
  });

  it("should not rate-limit a different IP", async () => {
    const app = buildTestApp();
    for (let i = 0; i < 10; i++) {
      await request(app).get("/test").set("X-Forwarded-For", "203.0.113.3");
    }
    const res = await request(app).get("/test").set("X-Forwarded-For", "203.0.113.4");

    expect(res.status).toBe(200);
  });
});
