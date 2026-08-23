import "../config/env.js";
import { Router } from "express";
import { runKeepaliveOperations } from "../services/keepaliveScheduler.js";

const router = Router();

router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized cron execution" });
  }

  const results = await runKeepaliveOperations();

  res.status(200).json({
    status: "keepalive task executed",
    results,
    timestamp: new Date()
  });
});

export default router;
