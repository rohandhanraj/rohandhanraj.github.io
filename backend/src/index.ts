import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import chatRouter from "./routes/chat.js";
import analyticsRouter from "./routes/analytics.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.use("/api/chat", chatRouter);
app.use("/api/analytics", analyticsRouter);

export default app;

