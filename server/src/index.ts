import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import roleRoutes from "./routes/roles";
import analysisRoutes from "./routes/analysis";
import roadmapRoutes from "./routes/roadmap";
import interviewRoutes from "./routes/interview";
import chatRoutes from "./routes/chat";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(Number(env.PORT), () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

start();
