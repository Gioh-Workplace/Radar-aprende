import { compare } from "bcryptjs";
import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../app";
import { UserModel } from "../../models/user.model";
import {
  createStudentFactory,
  createTeacherFactory,
} from "../factories/user.factory";
import {
  defaultTeacherRegistration,
  getTeacherToken,
  loginAndGetToken,
  loginUser,
  registerTeacher,
} from "../helpers/auth.helper";

describe("Authentication", () => {
  it(
    "registers a teacher successfully",
    async () => {
      const response =
        await registerTeacher();

      expect(response.status).toBe(201);

      expect(response.body.user).toMatchObject({
        name:
          defaultTeacherRegistration.name,

        email:
          defaultTeacherRegistration.email,

        role: "TEACHER",
      });

      expect(
        response.body.user.id,
      ).toEqual(expect.any(String));

      const responseContent =
        JSON.stringify(response.body);

      expect(responseContent).not.toContain(
        "passwordHash",
      );

      expect(responseContent).not.toContain(
        defaultTeacherRegistration.password,
      );

      const savedTeacher =
        await UserModel.findOne({
          email:
            defaultTeacherRegistration.email,
        }).select("+passwordHash");

      expect(savedTeacher).not.toBeNull();

      expect(
        savedTeacher?.passwordHash,
      ).not.toBe(
        defaultTeacherRegistration.password,
      );

      const passwordMatches =
        savedTeacher?.passwordHash
          ? await compare(
              defaultTeacherRegistration.password,
              savedTeacher.passwordHash,
            )
          : false;

      expect(passwordMatches).toBe(true);
    },
  );

  it(
    "rejects a duplicated teacher email",
    async () => {
      await registerTeacher();

      const response =
        await registerTeacher();

      expect(response.status).toBe(409);

      expect(response.body.message).toEqual(
        expect.any(String),
      );

      expect(response.body.code).toEqual(
        expect.any(String),
      );

      const teachers =
        await UserModel.countDocuments({
          email:
            defaultTeacherRegistration.email,
        });

      expect(teachers).toBe(1);
    },
  );

  it(
    "authenticates a teacher by email",
    async () => {
      await registerTeacher();

      const response = await loginUser(
        defaultTeacherRegistration.email,
        defaultTeacherRegistration.password,
      );

      expect(response.status).toBe(200);

      expect(response.body.token).toEqual(
        expect.any(String),
      );

      expect(response.body.user).toMatchObject({
        email:
          defaultTeacherRegistration.email,

        role: "TEACHER",
      });

      const responseContent =
        JSON.stringify(response.body);

      expect(responseContent).not.toContain(
        "passwordHash",
      );

      expect(responseContent).not.toContain(
        defaultTeacherRegistration.password,
      );
    },
  );

  it(
    "authenticates a student by registration",
    async () => {
      const { user: teacher } =
        await createTeacherFactory();

      const { user: student, password } =
        await createStudentFactory({
          createdBy: teacher._id,
          registration: "ALUNO001",
        });

      const response = await loginUser(
        "ALUNO001",
        password,
      );

      expect(response.status).toBe(200);

      expect(response.body.token).toEqual(
        expect.any(String),
      );

      expect(response.body.user).toMatchObject({
        id: String(student._id),
        registration: "ALUNO001",
        role: "STUDENT",
      });

      expect(
        JSON.stringify(response.body),
      ).not.toContain("passwordHash");
    },
  );

  it(
    "rejects an incorrect password",
    async () => {
      await createTeacherFactory({
        email:
          "senha-incorreta@radaraprende.test",
        password: "Professor123",
      });

      const response = await loginUser(
        "senha-incorreta@radaraprende.test",
        "SenhaIncorreta123",
      );

      expect(response.status).toBe(401);

      expect(response.body.message).toEqual(
        expect.any(String),
      );

      expect(response.body.code).toEqual(
        expect.any(String),
      );

      expect(response.body.token).toBeUndefined();
    },
  );

  it(
    "rejects login for a nonexistent credential",
    async () => {
      const response = await loginUser(
        "usuario-inexistente@radaraprende.test",
        "Professor123",
      );

      expect(response.status).toBe(401);

      expect(response.body.token).toBeUndefined();
    },
  );

  it(
    "returns the authenticated user from auth me",
    async () => {
      const token =
        await getTeacherToken();

      const response = await request(app)
        .get("/auth/me")
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

      expect(response.status).toBe(200);

      expect(response.body.user).toMatchObject({
        name:
          defaultTeacherRegistration.name,

        email:
          defaultTeacherRegistration.email,

        role: "TEACHER",
      });

      expect(
        JSON.stringify(response.body),
      ).not.toContain("passwordHash");
    },
  );

  it(
    "rejects auth me without a token",
    async () => {
      const response = await request(app)
        .get("/auth/me");

      expect(response.status).toBe(401);

      expect(response.body.message).toEqual(
        expect.any(String),
      );

      expect(response.body.code).toEqual(
        expect.any(String),
      );
    },
  );

  it(
    "rejects auth me with an invalid token",
    async () => {
      const response = await request(app)
        .get("/auth/me")
        .set(
          "Authorization",
          "Bearer token-invalido",
        );

      expect(response.status).toBe(401);

      expect(response.body.code).toEqual(
        expect.any(String),
      );
    },
  );

  it(
    "rejects a teacher password whose UTF-8 representation exceeds the bcrypt limit",
    async () => {
      const email =
        "senha-longa@radaraprende.test";

      const longUtf8Password =
        "á".repeat(40);

      expect(
        longUtf8Password.length,
      ).toBe(40);

      const response =
        await registerTeacher({
          name:
            "Professora Senha Longa",

          email,

          password:
            longUtf8Password,
        });

      expect(response.status).toBe(
        400,
      );

      expect(response.body).toEqual({
        message:
          "A senha informada excede o tamanho máximo suportado.",

        code: "PASSWORD_TOO_LONG",
      });

      const persistedTeacher =
        await UserModel.findOne({
          email,
        });

      expect(
        persistedTeacher,
      ).toBeNull();
    },
  );

  it(
    "rejects login for an inactive user",
    async () => {
      const email =
        "professor-inativo@radaraprende.test";

      const {
        password,
      } = await createTeacherFactory({
        email,
        active: false,
      });

      const response = await loginUser(
        email,
        password,
      );

      expect(response.status).toBe(
        403,
      );

      expect(response.body).toEqual({
        message:
          "Este usuário está desativado.",

        code: "USER_INACTIVE",
      });
    },
  );

  it(
    "rejects auth me after the authenticated user is deactivated",
    async () => {
      const email =
        "desativado-depois-login@radaraprende.test";

      const {
        user,
        password,
      } = await createTeacherFactory({
        email,
      });

      const token =
        await loginAndGetToken(
          email,
          password,
        );

      await UserModel.updateOne(
        {
          _id: user._id,
        },
        {
          $set: {
            active: false,
          },
        },
      );

      const response = await request(app)
        .get("/auth/me")
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

      expect(response.status).toBe(
        404,
      );

      expect(response.body.code).toBe(
        "USER_NOT_FOUND",
      );
    },
  );

  it(
    "rejects auth me after the authenticated user is removed",
    async () => {
      const email =
        "removido-depois-login@radaraprende.test";

      const {
        user,
        password,
      } = await createTeacherFactory({
        email,
      });

      const token =
        await loginAndGetToken(
          email,
          password,
        );

      await UserModel.deleteOne({
        _id: user._id,
      });

      const response = await request(app)
        .get("/auth/me")
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

      expect(response.status).toBe(
        404,
      );

      expect(response.body.code).toBe(
        "USER_NOT_FOUND",
      );
    },
  );

  it(
    "returns the current student with registration and no email",
    async () => {
      const {
        user: teacher,
      } = await createTeacherFactory({
        email:
          "professor-auth-me-aluno@radaraprende.test",
      });

      const {
        user: student,
        password,
      } = await createStudentFactory({
        createdBy:
          teacher._id,

        name:
          "Estudante Auth Me",

        registration:
          "ALUNO-AUTH-ME",
      });

      const token =
        await loginAndGetToken(
          student.registration ??
            "ALUNO-AUTH-ME",

          password,
        );

      const response = await request(app)
        .get("/auth/me")
        .set(
          "Authorization",
          `Bearer ${token}`,
        );

      expect(response.status).toBe(
        200,
      );

      expect(
        response.body.user,
      ).toMatchObject({
        id: String(student._id),

        name:
          "Estudante Auth Me",

        email: null,

        registration:
          "ALUNO-AUTH-ME",

        role: "STUDENT",
        active: true,
      });
    },
  );

  it(
    "uses the default token expiration when the environment value is absent",
    async () => {
      const email =
        "expiracao-padrao@radaraprende.test";

      const {
        password,
      } = await createTeacherFactory({
        email,
      });

      const originalExpiration =
        process.env.JWT_EXPIRES_IN;

      delete process.env
        .JWT_EXPIRES_IN;

      try {
        const token =
          await loginAndGetToken(
            email,
            password,
          );

        expect(token).toEqual(
          expect.any(String),
        );
      } finally {
        if (
          originalExpiration ===
          undefined
        ) {
          delete process.env
            .JWT_EXPIRES_IN;
        } else {
          process.env
            .JWT_EXPIRES_IN =
            originalExpiration;
        }
      }
    },
  );
});