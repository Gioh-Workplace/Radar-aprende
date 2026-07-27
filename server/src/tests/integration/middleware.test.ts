import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ensureAuthenticated } from "../../middlewares/auth.middleware";
import {
  errorHandler,
  notFoundHandler,
} from "../../middlewares/error.middleware";
import { ensureRole } from "../../middlewares/role.middleware";

function getJwtSecret(): string {
  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET indisponível no teste.",
    );
  }

  return secret;
}

function createAuthenticationApp() {
  const testApp = express();

  testApp.get(
    "/protected",
    ensureAuthenticated,
    (_request, response) => {
      response.status(200).json({
        authenticated: true,
      });
    },
  );

  testApp.use(notFoundHandler);
  testApp.use(errorHandler);

  return testApp;
}

function createErrorApp() {
  const testApp = express();

  testApp.get(
    "/duplicate-with-fields",
    (_request, _response, next) => {
      const duplicateError =
        Object.assign(
          new Error(
            "Duplicate resource",
          ),
          {
            code: 11000,

            keyValue: {
              registration:
                "ALUNO001",
            },
          },
        );

      next(duplicateError);
    },
  );

  testApp.get(
    "/duplicate-without-fields",
    (_request, _response, next) => {
      const duplicateError =
        Object.assign(
          new Error(
            "Duplicate resource",
          ),
          {
            code: 11000,
          },
        );

      next(duplicateError);
    },
  );

  testApp.get(
    "/unexpected",
    (_request, _response, next) => {
      next(
        new Error(
          "Unexpected test error",
        ),
      );
    },
  );

  testApp.use(notFoundHandler);
  testApp.use(errorHandler);

  return testApp;
}

function createRoleApp() {
  const testApp = express();

  testApp.get(
    "/teacher-only",
    ensureRole("TEACHER"),
    (_request, response) => {
      response.status(200).json({
        allowed: true,
      });
    },
  );

  testApp.use(notFoundHandler);
  testApp.use(errorHandler);

  return testApp;
}

describe(
  "Authentication middleware",
  () => {
    it(
      "rejects a token with the wrong authentication scheme",
      async () => {
        const response = await request(
          createAuthenticationApp(),
        )
          .get("/protected")
          .set(
            "Authorization",
            "Basic qualquer-token",
          );

        expect(response.status).toBe(
          401,
        );

        expect(response.body.code).toBe(
          "INVALID_TOKEN_FORMAT",
        );
      },
    );

    it(
      "rejects a Bearer header without a token",
      async () => {
        const response = await request(
          createAuthenticationApp(),
        )
          .get("/protected")
          .set(
            "Authorization",
            "Bearer",
          );

        expect(response.status).toBe(
          401,
        );

        expect(response.body.code).toBe(
          "INVALID_TOKEN_FORMAT",
        );
      },
    );

    it(
      "rejects an expired token",
      async () => {
        const expiredToken = jwt.sign(
          {
            role: "TEACHER",
          },
          getJwtSecret(),
          {
            subject:
              "expired-teacher-id",

            expiresIn: -1,
          },
        );

        const response = await request(
          createAuthenticationApp(),
        )
          .get("/protected")
          .set(
            "Authorization",
            `Bearer ${expiredToken}`,
          );

        expect(response.status).toBe(
          401,
        );

        expect(response.body.code).toBe(
          "TOKEN_EXPIRED",
        );
      },
    );

    it(
      "rejects a token without a subject",
      async () => {
        const token = jwt.sign(
          {
            role: "TEACHER",
          },
          getJwtSecret(),
          {
            expiresIn: "1h",
          },
        );

        const response = await request(
          createAuthenticationApp(),
        )
          .get("/protected")
          .set(
            "Authorization",
            `Bearer ${token}`,
          );

        expect(response.status).toBe(
          401,
        );

        expect(response.body.code).toBe(
          "INVALID_TOKEN_PAYLOAD",
        );
      },
    );

    it(
      "rejects a token with an unsupported role",
      async () => {
        const token = jwt.sign(
          {
            role: "ADMIN",
          },
          getJwtSecret(),
          {
            subject:
              "administrator-id",

            expiresIn: "1h",
          },
        );

        const response = await request(
          createAuthenticationApp(),
        )
          .get("/protected")
          .set(
            "Authorization",
            `Bearer ${token}`,
          );

        expect(response.status).toBe(
          401,
        );

        expect(response.body.code).toBe(
          "INVALID_TOKEN_PAYLOAD",
        );
      },
    );

    it(
      "forwards an unexpected authentication configuration error",
      async () => {
        const originalSecret =
          process.env.JWT_SECRET;

        const consoleErrorSpy =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        const token = jwt.sign(
          {
            role: "TEACHER",
          },
          getJwtSecret(),
          {
            subject:
              "teacher-without-secret",

            expiresIn: "1h",
          },
        );

        delete process.env.JWT_SECRET;

        try {
          const response = await request(
            createAuthenticationApp(),
          )
            .get("/protected")
            .set(
              "Authorization",
              `Bearer ${token}`,
            );

          expect(
            response.status,
          ).toBe(500);

          expect(
            response.body.code,
          ).toBe(
            "INTERNAL_SERVER_ERROR",
          );
        } finally {
          if (
            originalSecret ===
            undefined
          ) {
            delete process.env
              .JWT_SECRET;
          } else {
            process.env.JWT_SECRET =
              originalSecret;
          }

          consoleErrorSpy.mockRestore();
        }
      },
    );
  },
);

describe(
  "Error middleware",
  () => {
    it(
      "handles duplicate resources and exposes duplicated fields",
      async () => {
        const response = await request(
          createErrorApp(),
        ).get(
          "/duplicate-with-fields",
        );

        expect(response.status).toBe(
          409,
        );

        expect(response.body).toEqual({
          message:
            "Já existe um cadastro com os dados informados.",

          code:
            "DUPLICATE_RESOURCE",

          fields: [
            "registration",
          ],
        });
      },
    );

    it(
      "handles duplicate resources without field metadata",
      async () => {
        const response = await request(
          createErrorApp(),
        ).get(
          "/duplicate-without-fields",
        );

        expect(response.status).toBe(
          409,
        );

        expect(response.body).toEqual({
          message:
            "Já existe um cadastro com os dados informados.",

          code:
            "DUPLICATE_RESOURCE",

          fields: [],
        });
      },
    );

    it(
      "returns an internal error for an unexpected exception",
      async () => {
        const consoleErrorSpy =
          vi.spyOn(
            console,
            "error",
          ).mockImplementation(
            () => undefined,
          );

        try {
          const response =
            await request(
              createErrorApp(),
            ).get("/unexpected");

          expect(
            response.status,
          ).toBe(500);

          expect(
            response.body,
          ).toEqual({
            message:
              "Ocorreu um erro interno no servidor.",

            code:
              "INTERNAL_SERVER_ERROR",
          });

          expect(
            consoleErrorSpy,
          ).toHaveBeenCalled();
        } finally {
          consoleErrorSpy.mockRestore();
        }
      },
    );

    it(
      "returns route metadata for an unknown endpoint",
      async () => {
        const response = await request(
          createErrorApp(),
        ).post(
          "/endpoint-inexistente",
        );

        expect(response.status).toBe(
          404,
        );

        expect(response.body).toEqual({
          message:
            "Rota não encontrada.",

          method: "POST",

          path:
            "/endpoint-inexistente",
        });
      },
    );
  },
);

describe(
  "Role middleware",
  () => {
    it(
      "rejects role verification without authenticated data",
      async () => {
        const response = await request(
          createRoleApp(),
        ).get("/teacher-only");

        expect(response.status).toBe(
          401,
        );

        expect(response.body).toEqual({
          message:
            "Usuário não autenticado.",

          code: "UNAUTHENTICATED",
        });
      },
    );
  },
);