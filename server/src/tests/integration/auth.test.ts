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
});