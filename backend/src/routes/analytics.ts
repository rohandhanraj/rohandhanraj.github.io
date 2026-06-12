import { Router } from "express";
import crypto from "crypto";
import { mongoClient } from "../config/db.js";

const router = Router();

// Middleware to resolve visitorId
router.use((req, res, next) => {
  let visitorId = req.cookies.visitor_id;
  const secure = req.secure || process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    maxAge: 365 * 24 * 60 * 60 * 1000
  };

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    res.cookie("visitor_id", visitorId, cookieOptions);
  }

  req.visitorId = visitorId;
  next();
});

// GET /api/visitor/info
router.get("/info", async (req, res) => {
  try {
    const db = mongoClient.db();
    const visits = await db.collection("analytics").find({ visitorId: req.visitorId }).toArray();
    res.status(200).json({
      visitorId: req.visitorId,
      totalVisits: visits.length,
      visits
    });
  } catch (err) {
    console.error("Failed to fetch visitor info:", err);
    res.status(500).json({ error: "Failed to fetch visitor info" });
  }
});

// POST /api/analytics
router.post("/", async (req, res) => {
  const { eventType, details = {} } = req.body;

  if (!eventType) {
    return res.status(400).json({ error: "eventType is required" });
  }

  try {
    const db = mongoClient.db();
    const headers = req.headers;
    const ip = req.ip || req.headers["x-forwarded-for"] || "";

    const doc = {
      visitorId: req.visitorId,
      eventType,
      details,
      userAgent: headers["user-agent"] || "",
      ip,
      timestamp: new Date()
    };

    await db.collection("analytics").insertOne(doc);
    res.status(201).json({ success: true, visitorId: req.visitorId });
  } catch (err) {
    console.error("Failed to insert analytics event:", err);
    res.status(500).json({ error: "Failed to log event" });
  }
});

export default router;
