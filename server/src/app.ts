import cors from "cors";
import express from "express";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  return response.status(200).json({
    status: "ok",
    service: "radar-aprende-api",
    timestamp: new Date().toISOString(),
  });
});