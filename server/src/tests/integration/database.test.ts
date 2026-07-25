import mongoose from "mongoose";
import {
  describe,
  expect,
  it,
} from "vitest";

describe("Test database", () => {
  it(
    "connects to an isolated in-memory database",
    async () => {
      const database =
        mongoose.connection.db;

      if (!database) {
        throw new Error(
          "O banco de testes não está conectado.",
        );
      }

      const collection =
        database.collection(
          "database-smoke-test",
        );

      await collection.insertOne({
        application: "RadarAprende",
      });

      const documentCount =
        await collection.countDocuments();

      expect(documentCount).toBe(1);

      expect(
        database.databaseName,
      ).toBe("radaraprende-test");
    },
  );
});