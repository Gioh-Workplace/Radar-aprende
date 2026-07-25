import { Types } from "mongoose";
import request from "supertest";
import {
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../../app";
import {
  createAssessmentFactory,
  type AssessmentQuestionFixture,
} from "../factories/assessment.factory";
import { createClassroomFactory } from "../factories/classroom.factory";
import { createSkillFactory } from "../factories/skill.factory";
import {
  createStudentFactory,
  createTeacherFactory,
} from "../factories/user.factory";
import { loginAndGetToken } from "../helpers/auth.helper";

interface SubmissionScenario {
  teacherToken: string;
  studentToken: string;
  assessmentId: string;
  classroomId: string;
  questions: AssessmentQuestionFixture[];
}

function bearerToken(
  token: string,
): string {
  return `Bearer ${token}`;
}

function getThreeQuestions(
  questions: AssessmentQuestionFixture[],
) {
  const [
    firstQuestion,
    secondQuestion,
    thirdQuestion,
  ] = questions;

  if (
    !firstQuestion ||
    !secondQuestion ||
    !thirdQuestion
  ) {
    throw new Error(
      "A avaliação precisa possuir três questões.",
    );
  }

  return {
    firstQuestion,
    secondQuestion,
    thirdQuestion,
  };
}

function buildAnswersWithTwoCorrect(
  questions: AssessmentQuestionFixture[],
) {
  const {
    firstQuestion,
    secondQuestion,
    thirdQuestion,
  } = getThreeQuestions(questions);

  return [
    {
      questionId:
        firstQuestion.questionId,

      selectedAlternativeId:
        firstQuestion.correctAlternativeId,
    },
    {
      questionId:
        secondQuestion.questionId,

      selectedAlternativeId:
        secondQuestion.correctAlternativeId,
    },
    {
      questionId:
        thirdQuestion.questionId,

      selectedAlternativeId:
        thirdQuestion.wrongAlternativeId,
    },
  ];
}

async function createSubmissionScenario():
Promise<SubmissionScenario> {
  const teacherEmail =
    "submissions@radaraprende.test";

  const studentRegistration =
    "ALUNO-SUBMISSION";

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

  const {
    user: student,
    password: studentPassword,
  } = await createStudentFactory({
    createdBy: new Types.ObjectId(
      String(teacher._id),
    ),

    registration:
      studentRegistration,
  });

  const studentToken =
    await loginAndGetToken(
      studentRegistration,
      studentPassword,
    );

  const classroom =
    await createClassroomFactory({
      teacherId: teacher._id,
      studentIds: [
        student._id,
      ],
    });

  const skill =
    await createSkillFactory({
      teacherId: teacher._id,
    });

  const {
    assessment,
    questions,
  } = await createAssessmentFactory({
    teacherId: teacher._id,
    classroomId: classroom._id,
    skillIds: [
      skill._id,
    ],
    status: "PUBLISHED",
  });

  return {
    teacherToken,
    studentToken,

    assessmentId:
      String(assessment._id),

    classroomId:
      String(classroom._id),

    questions,
  };
}

describe(
  "Student assessments and submissions",
  () => {
    it(
      "lists only published assessments from the student classroom",
      async () => {
        const scenario =
          await createSubmissionScenario();

        /*
         * Este rascunho pertence à mesma turma,
         * mas não deve aparecer para o aluno.
         */
        await createAssessmentFactory({
          teacherId:
            new Types.ObjectId(),

          classroomId:
            scenario.classroomId,

          skillIds: [
            new Types.ObjectId(),
          ],

          title:
            "Avaliação ainda em rascunho",

          status: "DRAFT",
        });

        const response = await request(app)
          .get("/student/assessments")
          .set(
            "Authorization",
            bearerToken(
              scenario.studentToken,
            ),
          );

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(1);

        expect(
          response.body.assessments,
        ).toHaveLength(1);

        expect(
            response.body.assessments[0],
          ).toMatchObject({
            id: scenario.assessmentId,
            questionCount: 3,
          });
          
          expect(
            response.body.assessments[0].status,
          ).toBeUndefined();

        expect(
          response.body.assessments[0]
            .questionCount,
        ).toBe(3);
      },
    );

    it(
      "does not expose correct answers when the student opens an assessment",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const response = await request(app)
          .get(
            `/student/assessments/${scenario.assessmentId}`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.studentToken,
            ),
          );

        expect(response.status).toBe(200);

        expect(
          response.body.assessment.questions,
        ).toHaveLength(3);

        const responseContent =
          JSON.stringify(response.body);

        expect(responseContent)
          .not.toContain("isCorrect");

        expect(responseContent)
          .not.toContain("skillId");

        expect(responseContent)
          .not.toContain("teacherId");
      },
    );

    it(
      "submits all answers and calculates the score automatically",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const answers =
          buildAnswersWithTwoCorrect(
            scenario.questions,
          );

        const response = await request(app)
          .post(
            `/student/assessments/${scenario.assessmentId}/submissions`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.studentToken,
            ),
          )
          .send({
            answers,
          });

        expect(response.status).toBe(201);

        expect(
          response.body.submission,
        ).toMatchObject({
          assessmentId:
            scenario.assessmentId,

          classroomId:
            scenario.classroomId,

          correctAnswers: 2,
          totalQuestions: 3,
          score: 66.67,
        });

        expect(
          response.body.submission.answers,
        ).toHaveLength(3);

        expect(
          response.body.submission
            .submittedAt,
        ).toEqual(expect.any(String));
      },
    );

    it(
      "returns the persisted student submission",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const answers =
          buildAnswersWithTwoCorrect(
            scenario.questions,
          );

        const submitResponse =
          await request(app)
            .post(
              `/student/assessments/${scenario.assessmentId}/submissions`,
            )
            .set(
              "Authorization",
              bearerToken(
                scenario.studentToken,
              ),
            )
            .send({
              answers,
            });

        expect(
          submitResponse.status,
        ).toBe(201);

        const response = await request(app)
          .get(
            `/student/assessments/${scenario.assessmentId}/submission`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.studentToken,
            ),
          );

        expect(response.status).toBe(200);

        expect(
          response.body.submission,
        ).toMatchObject({
          assessmentId:
            scenario.assessmentId,

          correctAnswers: 2,
          totalQuestions: 3,
          score: 66.67,
        });

        expect(
          response.body.submission.id,
        ).toBe(
          submitResponse.body
            .submission.id,
        );
      },
    );

    it(
      "prevents a second submission for the same assessment",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const body = {
          answers:
            buildAnswersWithTwoCorrect(
              scenario.questions,
            ),
        };

        const firstResponse =
          await request(app)
            .post(
              `/student/assessments/${scenario.assessmentId}/submissions`,
            )
            .set(
              "Authorization",
              bearerToken(
                scenario.studentToken,
              ),
            )
            .send(body);

        expect(
          firstResponse.status,
        ).toBe(201);

        const secondResponse =
          await request(app)
            .post(
              `/student/assessments/${scenario.assessmentId}/submissions`,
            )
            .set(
              "Authorization",
              bearerToken(
                scenario.studentToken,
              ),
            )
            .send(body);

        expect(
          secondResponse.status,
        ).toBe(409);

        expect(
          secondResponse.body.code,
        ).toBe(
          "ASSESSMENT_ALREADY_SUBMITTED",
        );
      },
    );

    it(
      "rejects an incomplete assessment submission",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const {
          firstQuestion,
        } = getThreeQuestions(
          scenario.questions,
        );

        const response = await request(app)
          .post(
            `/student/assessments/${scenario.assessmentId}/submissions`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.studentToken,
            ),
          )
          .send({
            answers: [
              {
                questionId:
                  firstQuestion.questionId,

                selectedAlternativeId:
                  firstQuestion
                    .correctAlternativeId,
              },
            ],
          });

        expect(response.status).toBe(422);

        expect(response.body.code).toBe(
          "INCOMPLETE_ASSESSMENT",
        );
      },
    );

    it(
      "rejects an alternative from another question",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const {
          firstQuestion,
          secondQuestion,
          thirdQuestion,
        } = getThreeQuestions(
          scenario.questions,
        );

        const response = await request(app)
          .post(
            `/student/assessments/${scenario.assessmentId}/submissions`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.studentToken,
            ),
          )
          .send({
            answers: [
              {
                questionId:
                  firstQuestion.questionId,

                selectedAlternativeId:
                  secondQuestion
                    .correctAlternativeId,
              },
              {
                questionId:
                  secondQuestion.questionId,

                selectedAlternativeId:
                  secondQuestion
                    .correctAlternativeId,
              },
              {
                questionId:
                  thirdQuestion.questionId,

                selectedAlternativeId:
                  thirdQuestion
                    .correctAlternativeId,
              },
            ],
          });

        expect(response.status).toBe(422);

        expect(response.body.code).toBe(
          "INVALID_SELECTED_ALTERNATIVE",
        );
      },
    );

    it(
      "hides the assessment from a student outside the classroom",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const outsiderRegistration =
          "ALUNO-OUTSIDER";

        const {
          user: anotherTeacher,
        } = await createTeacherFactory({
          email:
            "outsider-teacher@radaraprende.test",
        });

        const {
          password,
        } = await createStudentFactory({
          createdBy:
            new Types.ObjectId(
              String(
                anotherTeacher._id,
              ),
            ),

          registration:
            outsiderRegistration,
        });

        const outsiderToken =
          await loginAndGetToken(
            outsiderRegistration,
            password,
          );

        const response = await request(app)
          .get(
            `/student/assessments/${scenario.assessmentId}`,
          )
          .set(
            "Authorization",
            bearerToken(
              outsiderToken,
            ),
          );

        expect(response.status).toBe(404);

        expect(response.body.code).toBe(
          "ASSESSMENT_NOT_FOUND",
        );
      },
    );

    it(
      "prevents a teacher from submitting a student assessment",
      async () => {
        const scenario =
          await createSubmissionScenario();

        const response = await request(app)
          .post(
            `/student/assessments/${scenario.assessmentId}/submissions`,
          )
          .set(
            "Authorization",
            bearerToken(
              scenario.teacherToken,
            ),
          )
          .send({
            answers:
              buildAnswersWithTwoCorrect(
                scenario.questions,
              ),
          });

        expect(response.status).toBe(403);

        expect(response.body.code).toBe(
          "FORBIDDEN",
        );
      },
    );
  },
);