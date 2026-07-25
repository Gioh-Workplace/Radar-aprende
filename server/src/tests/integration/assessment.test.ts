import { Types } from "mongoose";
import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../app";
import { createClassroomFactory } from "../factories/classroom.factory";
import { createSkillFactory } from "../factories/skill.factory";
import {
  createStudentFactory,
  createTeacherFactory,
} from "../factories/user.factory";
import {
  loginAndGetToken,
} from "../helpers/auth.helper";

interface TeacherTestContext {
  teacherId: string;
  token: string;
}

async function createTeacherContext(
  email =
    "avaliacoes@radaraprende.test",
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

function buildValidQuestion(
  skillId: string,
) {
  return {
    statement:
      "Qual é o resultado de 1/2 + 1/4?",

    skillId,

    alternatives: [
      {
        text: "2/6",
        isCorrect: false,
      },
      {
        text: "3/4",
        isCorrect: true,
      },
      {
        text: "1/6",
        isCorrect: false,
      },
      {
        text: "2/4",
        isCorrect: false,
      },
    ],
  };
}

async function createAssessmentDraft(
  token: string,
  classroomId: string,
): Promise<string> {
  const response = await request(app)
    .post("/assessments")
    .set(
      "Authorization",
      bearerToken(token),
    )
    .send({
      title:
        "Avaliação diagnóstica de frações",

      description:
        "Avaliação criada durante os testes automatizados.",

      classroomId,
    });

  expect(response.status).toBe(201);

  const assessmentId: unknown =
    response.body.assessment?.id;

  if (typeof assessmentId !== "string") {
    throw new Error(
      "A criação da avaliação não retornou um ID.",
    );
  }

  return assessmentId;
}

async function addValidQuestion(
  token: string,
  assessmentId: string,
  skillId: string,
) {
  return request(app)
    .post(
      `/assessments/${assessmentId}/questions`,
    )
    .set(
      "Authorization",
      bearerToken(token),
    )
    .send(
      buildValidQuestion(skillId),
    );
}

describe("Teacher assessments", () => {
  it(
    "allows a teacher to create a draft assessment for their classroom",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const response = await request(app)
        .post("/assessments")
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          title:
            "Diagnóstico de Matemática",

          description:
            "Avaliação inicial da turma.",

          classroomId:
            String(classroom._id),
        });

      expect(response.status).toBe(201);

      expect(
        response.body.assessment,
      ).toMatchObject({
        title:
          "Diagnóstico de Matemática",

        classroomId:
          String(classroom._id),

        status: "DRAFT",
        questionCount: 0,
        active: true,
      });
    },
  );

  it(
    "rejects an assessment for another teacher classroom",
    async () => {
      const firstTeacher =
        await createTeacherContext(
          "primeiro-professor@radaraprende.test",
        );

      const secondTeacher =
        await createTeacherContext(
          "segundo-professor@radaraprende.test",
        );

      const secondTeacherClassroom =
        await createClassroomFactory({
          teacherId:
            secondTeacher.teacherId,
        });

      const response = await request(app)
        .post("/assessments")
        .set(
          "Authorization",
          bearerToken(
            firstTeacher.token,
          ),
        )
        .send({
          title:
            "Avaliação indevida",

          classroomId:
            String(
              secondTeacherClassroom._id,
            ),
        });

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "CLASSROOM_NOT_FOUND",
      );
    },
  );

  it(
    "prevents a student from using teacher assessment routes",
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
          "ALUNO-PERMISSION",
      });

      const studentToken =
        await loginAndGetToken(
          student.registration ??
            "ALUNO-PERMISSION",
          password,
        );

      const response = await request(app)
        .get("/assessments")
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
    "allows adding a valid question to a draft",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const skill =
        await createSkillFactory({
          teacherId:
            context.teacherId,
        });

      const assessmentId =
        await createAssessmentDraft(
          context.token,
          String(classroom._id),
        );

      const response =
        await addValidQuestion(
          context.token,
          assessmentId,
          String(skill._id),
        );

      expect(response.status).toBe(201);

      expect(
        response.body.assessment,
      ).toMatchObject({
        id: assessmentId,
        status: "DRAFT",
        questionCount: 1,
      });

      expect(
        response.body.assessment
          .questions,
      ).toHaveLength(1);

      expect(
        response.body.assessment
          .questions[0],
      ).toMatchObject({
        statement:
          "Qual é o resultado de 1/2 + 1/4?",

        skillId:
          String(skill._id),
      });
    },
  );

  it(
    "rejects a question with multiple correct alternatives",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const skill =
        await createSkillFactory({
          teacherId:
            context.teacherId,
        });

      const assessmentId =
        await createAssessmentDraft(
          context.token,
          String(classroom._id),
        );

      const response = await request(app)
        .post(
          `/assessments/${assessmentId}/questions`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        )
        .send({
          statement:
            "Questão com duas respostas corretas",

          skillId:
            String(skill._id),

          alternatives: [
            {
              text: "Alternativa A",
              isCorrect: true,
            },
            {
              text: "Alternativa B",
              isCorrect: true,
            },
          ],
        });

      expect(response.status).toBe(400);

      expect(response.body.code).toBe(
        "VALIDATION_ERROR",
      );
    },
  );

  it(
    "publishes a complete draft assessment",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const skill =
        await createSkillFactory({
          teacherId:
            context.teacherId,
        });

      const assessmentId =
        await createAssessmentDraft(
          context.token,
          String(classroom._id),
        );

      const questionResponse =
        await addValidQuestion(
          context.token,
          assessmentId,
          String(skill._id),
        );

      expect(
        questionResponse.status,
      ).toBe(201);

      const response = await request(app)
        .post(
          `/assessments/${assessmentId}/publish`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(200);

      expect(
        response.body.assessment,
      ).toMatchObject({
        id: assessmentId,
        status: "PUBLISHED",
        questionCount: 1,
      });

      expect(
        response.body.assessment
          .publishedAt,
      ).toEqual(expect.any(String));
    },
  );

  it(
    "rejects publishing an assessment without questions",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const assessmentId =
        await createAssessmentDraft(
          context.token,
          String(classroom._id),
        );

      const response = await request(app)
        .post(
          `/assessments/${assessmentId}/publish`,
        )
        .set(
          "Authorization",
          bearerToken(context.token),
        );

      expect(response.status).toBe(422);

      expect(response.body.code).toBe(
        "ASSESSMENT_WITHOUT_QUESTIONS",
      );
    },
  );

  it(
    "prevents changing an assessment after publication",
    async () => {
      const context =
        await createTeacherContext();

      const classroom =
        await createClassroomFactory({
          teacherId:
            context.teacherId,
        });

      const skill =
        await createSkillFactory({
          teacherId:
            context.teacherId,
        });

      const assessmentId =
        await createAssessmentDraft(
          context.token,
          String(classroom._id),
        );

      await addValidQuestion(
        context.token,
        assessmentId,
        String(skill._id),
      );

      const publishResponse =
        await request(app)
          .post(
            `/assessments/${assessmentId}/publish`,
          )
          .set(
            "Authorization",
            bearerToken(context.token),
          );

      expect(
        publishResponse.status,
      ).toBe(200);

      const response =
        await addValidQuestion(
          context.token,
          assessmentId,
          String(skill._id),
        );

      expect(response.status).toBe(409);

      expect(response.body.code).toBe(
        "ASSESSMENT_NOT_DRAFT",
      );
    },
  );

  it(
    "hides an assessment from another teacher",
    async () => {
      const owner =
        await createTeacherContext(
          "proprietario@radaraprende.test",
        );

      const otherTeacher =
        await createTeacherContext(
          "outro-professor@radaraprende.test",
        );

      const classroom =
        await createClassroomFactory({
          teacherId:
            owner.teacherId,
        });

      const assessmentId =
        await createAssessmentDraft(
          owner.token,
          String(classroom._id),
        );

      const response = await request(app)
        .get(
          `/assessments/${assessmentId}`,
        )
        .set(
          "Authorization",
          bearerToken(
            otherTeacher.token,
          ),
        );

      expect(response.status).toBe(404);

      expect(response.body.code).toBe(
        "ASSESSMENT_NOT_FOUND",
      );
    },
  );
});