import { Types } from "mongoose";
import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../app";
import { createSkillFactory } from "../factories/skill.factory";
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
  email = "habilidades@radaraprende.test",
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

describe("Teacher skills", () => {
  it(
    "allows a teacher to create a skill with normalized data",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .post("/skills")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "  Interpretação de gráficos  ",

          description:
            "  Interpretar informações apresentadas em gráficos.  ",

          subject:
            "  Matemática  ",
        });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        message:
          "Habilidade cadastrada com sucesso.",

        skill: {
          name:
            "Interpretação de gráficos",

          description:
            "Interpretar informações apresentadas em gráficos.",

          subject: "Matemática",

          teacherId:
            context.teacherId,

          active: true,
        },
      });

      expect(
        response.body.skill.id,
      ).toEqual(
        expect.any(String),
      );

      expect(
        response.body.skill.createdAt,
      ).toEqual(
        expect.any(String),
      );
    },
  );

  it(
    "stores an empty optional description as null",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .post("/skills")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "Resolver porcentagens",

          description: "   ",

          subject:
            "Matemática",
        });

      expect(response.status).toBe(201);

      expect(
        response.body.skill,
      ).toMatchObject({
        name:
          "Resolver porcentagens",

        description: null,
        subject: "Matemática",
        active: true,
      });
    },
  );

  it(
    "rejects invalid skill data",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .post("/skills")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name: "A",

          description:
            "x".repeat(501),

          subject: "M",
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
          "description",
          "subject",
        ]),
      );
    },
  );

  it(
    "prevents a duplicated skill ignoring letter case",
    async () => {
      const context =
        await createTeacherContext();

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name:
          "Razão (parte/todo) + revisão?",

        subject:
          "Matemática",
      });

      const response = await request(app)
        .post("/skills")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "razão (PARTE/TODO) + revisão?",

          subject:
            "matemática",
        });

      expect(response.status).toBe(409);

      expect(response.body).toMatchObject({
        message:
          "Já existe uma habilidade com este nome para a disciplina informada.",

        code:
          "SKILL_ALREADY_EXISTS",
      });
    },
  );

  it(
    "allows the same skill name in a different subject",
    async () => {
      const context =
        await createTeacherContext();

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name:
          "Interpretar tabelas",

        subject:
          "Matemática",
      });

      const response = await request(app)
        .post("/skills")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "Interpretar tabelas",

          subject:
            "Geografia",
        });

      expect(response.status).toBe(201);

      expect(
        response.body.skill,
      ).toMatchObject({
        name:
          "Interpretar tabelas",

        subject: "Geografia",
      });
    },
  );

  it(
    "allows recreating an inactive skill",
    async () => {
      const context =
        await createTeacherContext();

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name:
          "Comparar frações",

        subject:
          "Matemática",

        active: false,
      });

      const response = await request(app)
        .post("/skills")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          name:
            "Comparar frações",

          subject:
            "Matemática",
        });

      expect(response.status).toBe(201);

      expect(
        response.body.skill,
      ).toMatchObject({
        name:
          "Comparar frações",

        subject: "Matemática",
        active: true,
      });
    },
  );

  it(
    "lists only active skills created by the authenticated teacher",
    async () => {
      const context =
        await createTeacherContext();

      const otherTeacher =
        await createTeacherContext(
          "outro-habilidades@radaraprende.test",
        );

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name: "Frações",
        subject: "Matemática",
        active: true,
      });

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name: "Ecossistemas",
        subject: "Ciências",
        active: true,
      });

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name:
          "Habilidade arquivada",

        subject: "História",
        active: false,
      });

      await createSkillFactory({
        teacherId:
          otherTeacher.teacherId,

        name:
          "Habilidade de outro professor",

        subject: "Geografia",
        active: true,
      });

      const response = await request(app)
        .get("/skills")
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(response.body.total).toBe(
        2,
      );

      expect(
        response.body.skills.map(
          (skill: {
            name: string;
          }) => skill.name,
        ),
      ).toEqual([
        "Ecossistemas",
        "Frações",
      ]);

      expect(
        response.body.skills.every(
          (skill: {
            teacherId: string;
            active: boolean;
          }) =>
            skill.teacherId ===
              context.teacherId &&
            skill.active,
        ),
      ).toBe(true);
    },
  );

  it(
    "filters skills by subject ignoring case and surrounding spaces",
    async () => {
      const context =
        await createTeacherContext();

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name:
          "Resolver equações",

        subject:
          "Matemática",
      });

      await createSkillFactory({
        teacherId:
          context.teacherId,

        name:
          "Identificar biomas",

        subject:
          "Geografia",
      });

      const response = await request(app)
        .get(
          "/skills?subject=%20matem%C3%A1tica%20",
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(response.body.total).toBe(
        1,
      );

      expect(
        response.body.skills,
      ).toEqual([
        expect.objectContaining({
          name:
            "Resolver equações",

          subject:
            "Matemática",
        }),
      ]);
    },
  );

  it(
    "rejects an invalid subject filter",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .get("/skills?subject=A")
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(400);

      expect(response.body.code).toBe(
        "VALIDATION_ERROR",
      );
    },
  );

  it(
    "returns a skill owned by the authenticated teacher",
    async () => {
      const context =
        await createTeacherContext();

      const skill =
        await createSkillFactory({
          teacherId:
            context.teacherId,

          name:
            "Analisar proporcionalidade",

          description:
            "Reconhecer relações proporcionais.",

          subject:
            "Matemática",
        });

      const response = await request(app)
        .get(
          `/skills/${skill._id}`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(
        response.body.skill,
      ).toMatchObject({
        id: String(skill._id),

        name:
          "Analisar proporcionalidade",

        description:
          "Reconhecer relações proporcionais.",

        subject:
          "Matemática",

        teacherId:
          context.teacherId,

        active: true,
      });
    },
  );

  it(
    "hides a skill owned by another teacher",
    async () => {
      const firstTeacher =
        await createTeacherContext(
          "primeiro-skill@radaraprende.test",
        );

      const secondTeacher =
        await createTeacherContext(
          "segundo-skill@radaraprende.test",
        );

      const foreignSkill =
        await createSkillFactory({
          teacherId:
            secondTeacher.teacherId,
        });

      const response = await request(app)
        .get(
          `/skills/${foreignSkill._id}`,
        )
        .set(
          "Authorization",
          bearerToken(
            firstTeacher.token,
          ),
        );

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "SKILL_NOT_FOUND",
      );
    },
  );

  it(
    "hides an inactive skill",
    async () => {
      const context =
        await createTeacherContext();

      const inactiveSkill =
        await createSkillFactory({
          teacherId:
            context.teacherId,

          active: false,
        });

      const response = await request(app)
        .get(
          `/skills/${inactiveSkill._id}`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "SKILL_NOT_FOUND",
      );
    },
  );

  it(
    "rejects an invalid skill identifier",
    async () => {
      const context =
        await createTeacherContext();

      const response = await request(app)
        .get("/skills/invalid-id")
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(400);

      expect(response.body.code).toBe(
        "VALIDATION_ERROR",
      );
    },
  );

  it(
    "prevents students from accessing teacher skill routes",
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
          "ALUNO-SKILL-PERMISSION",
      });

      const studentToken =
        await loginAndGetToken(
          student.registration ??
            "ALUNO-SKILL-PERMISSION",
          password,
        );

      const response = await request(app)
        .get("/skills")
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
});