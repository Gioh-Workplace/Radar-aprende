import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../app";

describe("GET /health", () => {
  it(
    "returns a successful API health response",
    async () => {
      const response = await request(app)
        .get("/health");

      expect(response.status).toBe(200);

      expect(response.headers["content-type"])
        .toContain("application/json");
    },
  );
});