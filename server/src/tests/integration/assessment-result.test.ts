import { Types } from "mongoose";
import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../app";
import { createAssessmentFactory } from "../factories/assessment.factory";
import { createClassroomFactory } from "../factories/classroom.factory";
import { createSkillFactory } from "../factories/skill.factory";
import { createSubmissionFactory } from "../factories/submission.factory";
import {
  createStudentFactory,
  createTeacherFactory,
} from "../factories/user.factory";
import { loginAndGetToken } from "../helpers/auth.helper";

interface ResultsScenario {
  teacherToken: string;
  studentToken: string;
  assessmentId: string;
  classroomId: string;
}

function bearerToken(
  token: string,
): string {
  return `Bearer ${token}`;
}

async function createResultsScenario():
Promise<ResultsScenario> {
  const teacherEmail =
    "results@radaraprende.test";

  const {
    user: teacher,
    password: teacherPassword,
  } = await createTeacherFactory({
    email: teacherEmail,
  });

  const teacherToken =
    await loginAndGetToken(
      teacherEmail,
      teacherPassword,
    );

  const studentDefinitions = [
    {
      name: "Ana Almeida",
      registration: "RESULTADO001",
    },
    {
      name: "Bruno Barbosa",
      registration: "RESULTADO002",
    },
    {
      name: "Camila Cardoso",
      registration: "RESULTADO003",
    },
    {
      name: "Daniel Costa",
      registration: "RESULTADO004",
    },
  ];

  const createdStudents = [];

  for (
    const definition
    of studentDefinitions
  ) {
    const createdStudent =
      await createStudentFactory({
        createdBy:
          new Types.ObjectId(
            String(teacher._id),
          ),

        name: definition.name,
        registration:
          definition.registration,
      });

    createdStudents.push(
      createdStudent,
    );
  }

  const firstStudent =
    createdStudents[0];

  if (!firstStudent) {
    throw new Error(
      "Nenhum aluno foi criado.",
    );
  }

  const studentToken =
    await loginAndGetToken(
      studentDefinitions[0]!.registration,
      firstStudent.password,
    );

  const classroom =
    await createClassroomFactory({
      teacherId: teacher._id,

      studentIds:
        createdStudents.map(
          ({ user }) => user._id,
        ),
    });

  const consolidatedSkill =
    await createSkillFactory({
      teacherId: teacher._id,
      name: "Adição de frações",
    });

  const developingSkill =
    await createSkillFactory({
      teacherId: teacher._id,
      name: "Simplificação de frações",
    });

  const criticalSkill =
    await createSkillFactory({
      teacherId: teacher._id,
      name: "Comparação de frações",
    });

  const {
    assessment,
    questions,
  } = await createAssessmentFactory({
    teacherId: teacher._id,
    classroomId: classroom._id,

    skillIds: [
      consolidatedSkill._id,
      developingSkill._id,
      criticalSkill._id,
    ],

    status: "PUBLISHED",
  });

  const [
    firstCreatedStudent,
    secondCreatedStudent,
    thirdCreatedStudent,
  ] = createdStudents;

  if (
    !firstCreatedStudent ||
    !secondCreatedStudent ||
    !thirdCreatedStudent
  ) {
    throw new Error(
      "O cenário precisa possuir três alunos com submissões.",
    );
  }

  /*
   * Questão 1: 3/3 acertos = 100%
   * Questão 2: 2/3 acertos = 66,67%
   * Questão 3: 1/3 acertos = 33,33%
   */
  await createSubmissionFactory({
    assessmentId: assessment._id,
    classroomId: classroom._id,
    studentId:
      firstCreatedStudent.user._id,

    questions,
    correctness: [
      true,
      true,
      true,
    ],

    submittedAt:
      new Date("2026-07-24T12:00:00Z"),
  });

  await createSubmissionFactory({
    assessmentId: assessment._id,
    classroomId: classroom._id,
    studentId:
      secondCreatedStudent.user._id,

    questions,
    correctness: [
      true,
      true,
      false,
    ],

    submittedAt:
      new Date("2026-07-24T12:10:00Z"),
  });

  await createSubmissionFactory({
    assessmentId: assessment._id,
    classroomId: classroom._id,
    studentId:
      thirdCreatedStudent.user._id,

    questions,
    correctness: [
      true,
      false,
      false,
    ],

    submittedAt:
      new Date("2026-07-24T12:20:00Z"),
  });

  return {
    teacherToken,
    studentToken,

    assessmentId:
      String(assessment._id),

    classroomId:
      String(classroom._id),
  };
}

describe(
  "Assessment results and recommendations",
  () => {
    it(
      "calculates classroom summary metrics",
      async () => {
        const scenario =
          await createResultsScenario();

        const response = await request(app)
          .get(
            `/assessments/${scenario.assessmentId}/results`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.teacherToken,
            ),
          );

        expect(response.status).toBe(200);

        expect(
          response.body.results.assessment,
        ).toMatchObject({
          id: scenario.assessmentId,

          classroomId:
            scenario.classroomId,

          status: "PUBLISHED",
          questionCount: 3,
        });

        expect(
          response.body.results.summary,
        ).toEqual({
          totalStudents: 4,
          totalSubmissions: 3,
          pendingStudents: 1,
          completionRate: 75,
          averageScore: 66.67,
          highestScore: 100,
          lowestScore: 33.33,
        });
      },
    );

    it(
      "returns submitted and pending students",
      async () => {
        const scenario =
          await createResultsScenario();

        const response = await request(app)
          .get(
            `/assessments/${scenario.assessmentId}/results`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.teacherToken,
            ),
          );

        expect(response.status).toBe(200);

        const students =
          response.body.results.students;

        expect(students).toHaveLength(4);

        expect(
          students.filter(
            (
              student: {
                status: string;
              },
            ) =>
              student.status ===
              "SUBMITTED",
          ),
        ).toHaveLength(3);

        expect(
          students.filter(
            (
              student: {
                status: string;
              },
            ) =>
              student.status ===
              "PENDING",
          ),
        ).toHaveLength(1);

        const pendingStudent =
          students.find(
            (
              student: {
                status: string;
              },
            ) =>
              student.status ===
              "PENDING",
          );

        expect(pendingStudent).toMatchObject({
          name: "Daniel Costa",
          registration: "RESULTADO004",
          correctAnswers: null,
          score: null,
          submittedAt: null,
        });
      },
    );

    it(
      "calculates accuracy by question",
      async () => {
        const scenario =
          await createResultsScenario();

        const response = await request(app)
          .get(
            `/assessments/${scenario.assessmentId}/results`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.teacherToken,
            ),
          );

        expect(response.status).toBe(200);

        const questions =
          response.body.results.questions;

        expect(questions).toHaveLength(3);

        expect(questions[0]).toMatchObject({
          position: 1,
          correctAnswers: 3,
          totalAnswers: 3,
          accuracyRate: 100,
        });

        expect(questions[1]).toMatchObject({
          position: 2,
          correctAnswers: 2,
          totalAnswers: 3,
          accuracyRate: 66.67,
        });

        expect(questions[2]).toMatchObject({
          position: 3,
          correctAnswers: 1,
          totalAnswers: 3,
          accuracyRate: 33.33,
        });
      },
    );

    it(
      "classifies skills in pedagogical performance levels",
      async () => {
        const scenario =
          await createResultsScenario();

        const response = await request(app)
          .get(
            `/assessments/${scenario.assessmentId}/results`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.teacherToken,
            ),
          );

        expect(response.status).toBe(200);

        const skills =
          response.body.results.skills;

        expect(skills).toHaveLength(3);

        const criticalSkill =
          skills.find(
            (
              skill: {
                level: string;
              },
            ) =>
              skill.level ===
              "CRITICAL",
          );

        const developingSkill =
          skills.find(
            (
              skill: {
                level: string;
              },
            ) =>
              skill.level ===
              "DEVELOPING",
          );

        const consolidatedSkill =
          skills.find(
            (
              skill: {
                level: string;
              },
            ) =>
              skill.level ===
              "CONSOLIDATED",
          );

        expect(criticalSkill).toMatchObject({
          name: "Comparação de frações",
          accuracyRate: 33.33,
          correctAnswers: 1,
          totalAnswers: 3,
        });

        expect(developingSkill).toMatchObject({
          name: "Simplificação de frações",
          accuracyRate: 66.67,
          correctAnswers: 2,
          totalAnswers: 3,
        });

        expect(consolidatedSkill).toMatchObject({
          name: "Adição de frações",
          accuracyRate: 100,
          correctAnswers: 3,
          totalAnswers: 3,
        });

        expect(
          response.body.results
            .recommendationSummary,
        ).toEqual({
          criticalSkills: 1,
          developingSkills: 1,
          consolidatedSkills: 1,
          skillsWithoutData: 0,
        });
      },
    );

    it(
      "orders pedagogical recommendations by priority",
      async () => {
        const scenario =
          await createResultsScenario();

        const response = await request(app)
          .get(
            `/assessments/${scenario.assessmentId}/results`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.teacherToken,
            ),
          );

        expect(response.status).toBe(200);

        const recommendations =
          response.body.results
            .recommendations;

        expect(recommendations)
          .toHaveLength(3);

        expect(
          recommendations.map(
            (
              recommendation: {
                level: string;
              },
            ) =>
              recommendation.level,
          ),
        ).toEqual([
          "CRITICAL",
          "DEVELOPING",
          "CONSOLIDATED",
        ]);

        expect(
          recommendations.map(
            (
              recommendation: {
                priority: number;
              },
            ) =>
              recommendation.priority,
          ),
        ).toEqual([
          1,
          2,
          3,
        ]);

        expect(
          recommendations[0].actions.length,
        ).toBeGreaterThan(0);

        expect(
          recommendations[0].title,
        ).toBe(
          "Intervenção prioritária",
        );
      },
    );

    it(
      "returns no-data classifications before any submission",
      async () => {
        const teacherEmail =
          "no-data@radaraprende.test";

        const {
          user: teacher,
          password,
        } = await createTeacherFactory({
          email: teacherEmail,
        });

        const teacherToken =
          await loginAndGetToken(
            teacherEmail,
            password,
          );

        const {
          user: student,
        } = await createStudentFactory({
          createdBy:
            new Types.ObjectId(
              String(teacher._id),
            ),

          registration:
            "NO-DATA-001",
        });

        const classroom =
          await createClassroomFactory({
            teacherId: teacher._id,
            studentIds: [
              student._id,
            ],
          });

        const firstSkill =
          await createSkillFactory({
            teacherId: teacher._id,
            name: "Habilidade sem dados 1",
          });

        const secondSkill =
          await createSkillFactory({
            teacherId: teacher._id,
            name: "Habilidade sem dados 2",
          });

        const thirdSkill =
          await createSkillFactory({
            teacherId: teacher._id,
            name: "Habilidade sem dados 3",
          });

        const {
          assessment,
        } = await createAssessmentFactory({
          teacherId: teacher._id,
          classroomId: classroom._id,

          skillIds: [
            firstSkill._id,
            secondSkill._id,
            thirdSkill._id,
          ],

          status: "PUBLISHED",
        });

        const response = await request(app)
          .get(
            `/assessments/${String(
              assessment._id,
            )}/results`,
          )
          .set(
            "Authorization",
            bearerToken(teacherToken),
          );

        expect(response.status).toBe(200);

        expect(
          response.body.results.summary,
        ).toEqual({
          totalStudents: 1,
          totalSubmissions: 0,
          pendingStudents: 1,
          completionRate: 0,
          averageScore: null,
          highestScore: null,
          lowestScore: null,
        });

        expect(
          response.body.results.skills.every(
            (
              skill: {
                level: string;
              },
            ) =>
              skill.level ===
              "NO_DATA",
          ),
        ).toBe(true);

        expect(
          response.body.results
            .recommendationSummary,
        ).toEqual({
          criticalSkills: 0,
          developingSkills: 0,
          consolidatedSkills: 0,
          skillsWithoutData: 3,
        });
      },
    );

    it(
      "rejects results for a draft assessment",
      async () => {
        const teacherEmail =
          "draft-results@radaraprende.test";

        const {
          user: teacher,
          password,
        } = await createTeacherFactory({
          email: teacherEmail,
        });

        const token =
          await loginAndGetToken(
            teacherEmail,
            password,
          );

        const classroom =
          await createClassroomFactory({
            teacherId: teacher._id,
          });

        const skill =
          await createSkillFactory({
            teacherId: teacher._id,
          });

        const {
          assessment,
        } = await createAssessmentFactory({
          teacherId: teacher._id,
          classroomId: classroom._id,
          skillIds: [
            skill._id,
          ],
          status: "DRAFT",
        });

        const response = await request(app)
          .get(
            `/assessments/${String(
              assessment._id,
            )}/results`,
          )
          .set(
            "Authorization",
            bearerToken(token),
          );

        expect(response.status).toBe(409);

        expect(response.body.code).toBe(
          "ASSESSMENT_RESULTS_NOT_AVAILABLE",
        );
      },
    );

    it(
      "hides results from another teacher",
      async () => {
        const scenario =
          await createResultsScenario();

        const otherTeacherEmail =
          "other-results@radaraprende.test";

        const {
          password,
        } = await createTeacherFactory({
          email: otherTeacherEmail,
        });

        const otherTeacherToken =
          await loginAndGetToken(
            otherTeacherEmail,
            password,
          );

        const response = await request(app)
          .get(
            `/assessments/${scenario.assessmentId}/results`,
          )
          .set(
            "Authorization",
            bearerToken(
              otherTeacherToken,
            ),
          );

        expect(response.status).toBe(404);

        expect(response.body.code).toBe(
          "ASSESSMENT_NOT_FOUND",
        );
      },
    );

    it(
      "prevents students from accessing teacher analytics",
      async () => {
        const scenario =
          await createResultsScenario();

        const response = await request(app)
          .get(
            `/assessments/${scenario.assessmentId}/results`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.studentToken,
            ),
          );

        expect(response.status).toBe(403);

        expect(response.body.code).toBe(
          "FORBIDDEN",
        );
      },
    );
  },
);