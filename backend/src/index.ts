import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRouter from "./routes/chat.js";
import analyticsRouter from "./routes/analytics.js";
import keepaliveRouter from "./routes/keepalive.js";
import { setupSwagger } from "./swagger.js";

if (!(process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean).length) {
  console.warn(
    "[cors] ALLOWED_ORIGINS is not set — CORS is running in permissive mode and will allow requests from any origin."
  );
}

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(cookieParser());
app.use(express.json());

setupSwagger(app);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.use("/api/chat", chatRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/cron/keepalive", keepaliveRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Not allowed by CORS" });
  }
  next(err);
});

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });
}

export default app;


