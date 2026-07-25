import { MongoMemoryServer } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

export default async function globalSetup(
  project: TestProject,
) {
  const mongoServer =
    await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();

  project.provide(
    "MONGO_URI",
    mongoUri,
  );

  return async () => {
    await mongoServer.stop();
  };
}