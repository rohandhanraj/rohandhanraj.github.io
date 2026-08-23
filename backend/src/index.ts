import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRouter from "./routes/chat.js";
import analyticsRouter from "./routes/analytics.js";
import keepaliveRouter from "./routes/keepalive.js";
import { startKeepaliveScheduler } from "./services/keepaliveScheduler.js";
import { setupSwagger } from "./swagger.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

setupSwagger(app);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.use("/api/chat", chatRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/cron/keepalive", keepaliveRouter);

if (process.env.NODE_ENV !== "test") {
  startKeepaliveScheduler();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });
}

export default app;


