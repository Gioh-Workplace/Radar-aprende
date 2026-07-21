import cors from "cors";
import express from "express";
import mongoose from "mongoose";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  return response.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? "ok" : "degraded",
    service: "radar-aprende-api",
    database: isDatabaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});