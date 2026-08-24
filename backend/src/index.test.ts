import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import app from "./index.js";

describe("GET /health", () => {
  it("should return healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});

describe("CORS allowlist", () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it("should allow any origin when ALLOWED_ORIGINS is unset", async () => {
    const res = await request(app).get("/health").set("Origin", "https://anything.example.com");
    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("https://anything.example.com");
  });

  it("should reject an origin not in ALLOWED_ORIGINS", async () => {
    process.env.ALLOWED_ORIGINS = "https://rohandhanraj.github.io";
    const res = await request(app).get("/health").set("Origin", "https://evil.example.com");
    expect(res.status).toBe(403);
  });

  it("should allow an origin listed in ALLOWED_ORIGINS", async () => {
    process.env.ALLOWED_ORIGINS = "https://rohandhanraj.github.io";
    const res = await request(app).get("/health").set("Origin", "https://rohandhanraj.github.io");
    expect(res.status).toBe(200);
  });
});
