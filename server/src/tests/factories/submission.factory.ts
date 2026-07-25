import { Types } from "mongoose";

import { SubmissionModel } from "../../models/submission.model";
import type { AssessmentQuestionFixture } from "./assessment.factory";

type ObjectIdLike =
  | Types.ObjectId
  | string;

interface SubmissionFactoryOptions {
  assessmentId: ObjectIdLike;
  classroomId: ObjectIdLike;
  studentId: ObjectIdLike;
  questions: AssessmentQuestionFixture[];
  correctness: boolean[];
  submittedAt?: Date;
}

function toObjectId(
  value: ObjectIdLike,
): Types.ObjectId {
  return new Types.ObjectId(
    String(value),
  );
}

export async function createSubmissionFactory(
  options: SubmissionFactoryOptions,
) {
  if (
    options.questions.length !==
    options.correctness.length
  ) {
    throw new Error(
      "Cada questão precisa possuir uma indicação de acerto ou erro.",
    );
  }

  if (options.questions.length === 0) {
    throw new Error(
      "A submissão precisa possuir pelo menos uma resposta.",
    );
  }

  const answers =
    options.questions.map(
      (question, index) => {
        const isCorrect =
          options.correctness[index];

        if (isCorrect === undefined) {
          throw new Error(
            "O padrão de correção está incompleto.",
          );
        }

        return {
          questionId:
            toObjectId(question.questionId),

          selectedAlternativeId:
            toObjectId(
              isCorrect
                ? question.correctAlternativeId
                : question.wrongAlternativeId,
            ),

          skillId:
            toObjectId(question.skillId),

          isCorrect,
        };
      },
    );

  const correctAnswers =
    answers.filter(
      (answer) => answer.isCorrect,
    ).length;

  const totalQuestions =
    answers.length;

  const score = Number(
    (
      (
        correctAnswers /
        totalQuestions
      ) * 100
    ).toFixed(2),
  );

  return SubmissionModel.create({
    assessmentId:
      toObjectId(options.assessmentId),

    classroomId:
      toObjectId(options.classroomId),

    studentId:
      toObjectId(options.studentId),

    answers,
    correctAnswers,
    totalQuestions,
    score,

    submittedAt:
      options.submittedAt ??
      new Date(),
  });
}