import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware";
import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";


export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  const isDatabaseConnected =
    mongoose.connection.readyState === 1;

  response
    .status(isDatabaseConnected ? 200 : 503)
    .json({
      status: isDatabaseConnected ? "ok" : "degraded",
      service: "radar-aprende-api",
      database: isDatabaseConnected
        ? "connected"
        : "disconnected",
      timestamp: new Date().toISOString(),
    });
});

app.use("/auth", authRouter);
app.use("/users", userRouter);

app.use(notFoundHandler);
app.use(errorHandler);