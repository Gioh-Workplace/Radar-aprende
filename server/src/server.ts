import "dotenv/config";

import { setServers } from "node:dns";

import { app } from "./app";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "./config/database";

setServers(["8.8.8.8", "1.1.1.1"]);

const port = Number(process.env.PORT) || 3333;

async function bootstrap(): Promise<void> {
  try {
    await connectToDatabase();

    const server = app.listen(port, () => {
      console.log(`RadarAprende API running on http://localhost:${port}`);
    });

    async function shutdown(signal: string): Promise<void> {
      console.log(`${signal} received. Closing application...`);

      server.close(async () => {
        await disconnectFromDatabase();
        process.exit(0);
      });
    }

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  } catch (error) {
    console.error("Failed to start RadarAprende API:", error);
    process.exit(1);
  }
}

void bootstrap();