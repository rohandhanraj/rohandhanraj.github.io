import { describe, it, expect, vi } from "vitest";
import { mongoClient, neo4jDriver, qdrantClient } from "./db.js";

describe("Database Clients Configuration", () => {
  it("should instantiate the database clients", () => {
    expect(mongoClient).toBeDefined();
    expect(neo4jDriver).toBeDefined();
    expect(qdrantClient).toBeDefined();
  });
});
