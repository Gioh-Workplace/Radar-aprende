import mongoose from "mongoose";
import request from "supertest";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { app } from "../../app";

describe("GET /health", () => {
  it(
    "returns a successful API health response when the database is connected",
    async () => {
      const response = await request(app)
        .get("/health");

      expect(response.status).toBe(200);

      expect(
        response.headers[
          "content-type"
        ],
      ).toContain(
        "application/json",
      );

      expect(response.body).toMatchObject({
        status: "ok",
        service:
          "radar-aprende-api",
        database: "connected",
      });

      expect(
        response.body.timestamp,
      ).toEqual(
        expect.any(String),
      );
    },
  );

  it(
    "returns a degraded health response when the database is disconnected",
    async () => {
      const readyStateSpy = vi
        .spyOn(
          mongoose.connection,
          "readyState",
          "get",
        )
        .mockReturnValue(0);

      try {
        const response = await request(
          app,
        ).get("/health");

        expect(response.status).toBe(
          503,
        );

        expect(response.body).toMatchObject({
          status: "degraded",
          service:
            "radar-aprende-api",
          database:
            "disconnected",
        });

        expect(
          response.body.timestamp,
        ).toEqual(
          expect.any(String),
        );
      } finally {
        readyStateSpy.mockRestore();
      }
    },
  );
});