import { compare } from "bcryptjs";
import { Types } from "mongoose";
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
import { loginAndGetToken } from "../helpers/auth.helper";

interface TeacherTestContext {
  teacherId: string;
  token: string;
}

async function createTeacherContext(
  email = "estudantes@radaraprende.test",
): Promise<TeacherTestContext> {
  const {
    user: teacher,
    password,
  } = await createTeacherFactory({
    email,
  });

  const token = await loginAndGetToken(
    email,
    password,
  );

  return {
    teacherId: String(teacher._id),
    token,
  };
}

function bearerToken(
  token: string,
): string {
  return `Bearer ${token}`;
}

describe("Teacher students", () => {
  it(
    "allows a teacher to create a student with normalized data",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .post("/users/students")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "  Beatriz Almeida  ",

          registration:
            "  aluno.demo-001  ",

          password:
            "Aluno123",
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        message:
          "Aluno cadastrado com sucesso.",

        student: {
          name:
            "Beatriz Almeida",

          email: null,

          registration:
            "ALUNO.DEMO-001",

          role: "STUDENT",
          active: true,
        },
      });

      expect(
        response.body.student.id,
      ).toEqual(
        expect.any(String),
      );

      expect(
        response.body.student.createdAt,
      ).toEqual(
        expect.any(String),
      );

      const responseContent =
        JSON.stringify(response.body);

      expect(
        responseContent,
      ).not.toContain(
        "passwordHash",
      );

      expect(
        responseContent,
      ).not.toContain(
        "Aluno123",
      );

      const persistedStudent =
        await UserModel.findOne({
          registration:
            "ALUNO.DEMO-001",
        }).select("+passwordHash");

      expect(
        persistedStudent,
      ).not.toBeNull();

      expect(
        persistedStudent?.createdBy?.toString(),
      ).toBe(
        context.teacherId,
      );

      expect(
        persistedStudent?.passwordHash,
      ).not.toBe(
        "Aluno123",
      );

      const passwordMatches =
        persistedStudent?.passwordHash
          ? await compare(
              "Aluno123",
              persistedStudent.passwordHash,
            )
          : false;

      expect(passwordMatches).toBe(
        true,
      );
    },
  );

  it(
    "rejects invalid student data",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .post("/users/students")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name: "A",
          registration: "@",
          password: "123",
        });

      expect(response.status).toBe(400);

      expect(response.body).toMatchObject({
        message:
          "Dados da requisição inválidos.",

        code: "VALIDATION_ERROR",
      });

      const invalidFields = (
        response.body.details as Array<{
          field: string;
        }>
      ).map(
        (detail) => detail.field,
      );

      expect(invalidFields).toEqual(
        expect.arrayContaining([
          "name",
          "registration",
          "password",
        ]),
      );
    },
  );

  it(
    "prevents duplicated registrations ignoring letter case",
    async () => {
      const context =
        await createTeacherContext();

      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        registration:
          "ALUNO-DUPLICADO-001",
      });

      const response = await request(app)
        .post("/users/students")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "Outro estudante",

          registration:
            "aluno-duplicado-001",

          password:
            "Aluno123",
        });

      expect(response.status).toBe(409);

      expect(response.body).toMatchObject({
        message:
          "Já existe um aluno com esta matrícula.",

        code:
          "REGISTRATION_ALREADY_EXISTS",
      });

      const matchingStudents =
        await UserModel.countDocuments({
          registration:
            "ALUNO-DUPLICADO-001",
        });

      expect(
        matchingStudents,
      ).toBe(1);
    },
  );

  it(
    "prevents duplicated registrations created by another teacher",
    async () => {
      const firstTeacher =
        await createTeacherContext(
          "primeiro-estudantes@radaraprende.test",
        );

      const secondTeacher =
        await createTeacherContext(
          "segundo-estudantes@radaraprende.test",
        );

      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            secondTeacher.teacherId,
          ),

        registration:
          "MATRICULA-GLOBAL-001",
      });

      const response = await request(app)
        .post("/users/students")
        .set(
          "Authorization",
          bearerToken(
            firstTeacher.token,
          ),
        )
        .send({
          name:
            "Nova tentativa",

          registration:
            "MATRICULA-GLOBAL-001",

          password:
            "Aluno123",
        });

      expect(response.status).toBe(409);

      expect(response.body.code).toBe(
        "REGISTRATION_ALREADY_EXISTS",
      );
    },
  );

  it(
    "rejects a password whose UTF-8 representation exceeds the bcrypt limit",
    async () => {
      const context =
        await createTeacherContext();

      /*
       * A string possui 40 caracteres,
       * mas 80 bytes em UTF-8.
       *
       * Assim, passa pelo limite de
       * caracteres do Zod e alcança
       * a proteção específica do bcrypt.
       */
      const longUtf8Password =
        "á".repeat(40);

      expect(
        longUtf8Password.length,
      ).toBe(40);

      const response = await request(app)
        .post("/users/students")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "Estudante Senha Longa",

          registration:
            "ALUNO-SENHA-LONGA",

          password:
            longUtf8Password,
        });

      expect(response.status).toBe(400);

      expect(response.body).toMatchObject({
        message:
          "A senha informada excede o tamanho máximo suportado.",

        code: "PASSWORD_TOO_LONG",
      });

      const persistedStudent =
        await UserModel.findOne({
          registration:
            "ALUNO-SENHA-LONGA",
        });

      expect(
        persistedStudent,
      ).toBeNull();
    },
  );

  it(
    "lists only active students created by the authenticated teacher",
    async () => {
      const context =
        await createTeacherContext();

      const otherTeacher =
        await createTeacherContext(
          "outro-professor-estudantes@radaraprende.test",
        );

      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        name:
          "Bruno Ferreira",

        registration:
          "ALUNO-LISTA-002",

        active: true,
      });

      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        name:
          "Ana Martins",

        registration:
          "ALUNO-LISTA-001",

        active: true,
      });

      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        name:
          "Estudante Inativo",

        registration:
          "ALUNO-LISTA-INATIVO",

        active: false,
      });

      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            otherTeacher.teacherId,
          ),

        name:
          "Estudante Externo",

        registration:
          "ALUNO-LISTA-EXTERNO",

        active: true,
      });

      const response = await request(app)
        .get("/users/students")
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(response.body.total).toBe(
        2,
      );

      expect(
        response.body.students.map(
          (student: {
            name: string;
          }) => student.name,
        ),
      ).toEqual([
        "Ana Martins",
        "Bruno Ferreira",
      ]);

      expect(
        response.body.students,
      ).toEqual([
        expect.objectContaining({
          name:
            "Ana Martins",

          email: null,

          registration:
            "ALUNO-LISTA-001",

          role: "STUDENT",
          active: true,
        }),

        expect.objectContaining({
          name:
            "Bruno Ferreira",

          email: null,

          registration:
            "ALUNO-LISTA-002",

          role: "STUDENT",
          active: true,
        }),
      ]);

      expect(
        response.body.students.every(
          (student: {
            active: boolean;
          }) => student.active,
        ),
      ).toBe(true);
    },
  );

  it(
    "returns an empty list when the teacher has no active students",
    async () => {
      const context =
        await createTeacherContext();

      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            context.teacherId,
          ),

        registration:
          "ALUNO-SOMENTE-INATIVO",

        active: false,
      });

      const response = await request(app)
        .get("/users/students")
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(response.body).toEqual({
        students: [],
        total: 0,
      });
    },
  );

  it(
    "prevents a student from listing teacher students",
    async () => {
      const teacherContext =
        await createTeacherContext();

      const {
        user: student,
        password,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            teacherContext.teacherId,
          ),

        registration:
          "ALUNO-USERS-PERMISSION",
      });

      const studentToken =
        await loginAndGetToken(
          student.registration ??
            "ALUNO-USERS-PERMISSION",
          password,
        );

      const response = await request(app)
        .get("/users/students")
        .set(
          "Authorization",
          bearerToken(studentToken),
        );

      expect(response.status).toBe(403);

      expect(response.body.code).toBe(
        "FORBIDDEN",
      );
    },
  );

  it(
    "prevents a student from creating another student",
    async () => {
      const teacherContext =
        await createTeacherContext();

      const {
        user: student,
        password,
      } = await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            teacherContext.teacherId,
          ),

        registration:
          "ALUNO-USERS-CREATE-PERMISSION",
      });

      const studentToken =
        await loginAndGetToken(
          student.registration ??
            "ALUNO-USERS-CREATE-PERMISSION",
          password,
        );

      const response = await request(app)
        .post("/users/students")
        .set(
          "Authorization",
          bearerToken(studentToken),
        )
        .send({
          name:
            "Criação Indevida",

          registration:
            "ALUNO-INDEVIDO",

          password:
            "Aluno123",
        });

      expect(response.status).toBe(403);

      expect(response.body.code).toBe(
        "FORBIDDEN",
      );
    },
  );
});