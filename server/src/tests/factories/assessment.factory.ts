import { Types } from "mongoose";

import {
  AssessmentModel,
  type AssessmentStatus,
} from "../../models/assessment.model";

type ObjectIdLike =
  | Types.ObjectId
  | string;

interface AssessmentFactoryOptions {
  teacherId: ObjectIdLike;
  classroomId: ObjectIdLike;
  skillIds: ObjectIdLike[];
  title?: string;
  status?: AssessmentStatus;
  active?: boolean;
}

export interface AssessmentQuestionFixture {
  questionId: string;
  correctAlternativeId: string;
  wrongAlternativeId: string;
}

function toObjectId(
  value: ObjectIdLike,
): Types.ObjectId {
  return new Types.ObjectId(
    String(value),
  );
}

export async function createAssessmentFactory(
  options: AssessmentFactoryOptions,
) {
  if (options.skillIds.length === 0) {
    throw new Error(
      "A factory precisa receber pelo menos uma habilidade.",
    );
  }

  const status =
    options.status ?? "PUBLISHED";

  const questionTemplates = [
    {
      statement:
        "Qual é o resultado de 1/2 + 1/4?",

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
      ],
    },
    {
      statement:
        "Qual é a forma simplificada de 8/12?",

      alternatives: [
        {
          text: "2/3",
          isCorrect: true,
        },
        {
          text: "4/5",
          isCorrect: false,
        },
        {
          text: "3/4",
          isCorrect: false,
        },
      ],
    },
    {
      statement:
        "Qual fração representa metade de um inteiro?",

      alternatives: [
        {
          text: "1/3",
          isCorrect: false,
        },
        {
          text: "2/3",
          isCorrect: false,
        },
        {
          text: "1/2",
          isCorrect: true,
        },
      ],
    },
  ];

  const questions =
    questionTemplates.map(
      (template, questionIndex) => {
        const skillId =
          options.skillIds[
            questionIndex %
              options.skillIds.length
          ];

        if (!skillId) {
          throw new Error(
            "Não foi possível selecionar a habilidade da questão.",
          );
        }

        return {
          statement: template.statement,
          skillId: toObjectId(skillId),
          alternatives:
            template.alternatives,
        };
      },
    );

  const assessment =
    await AssessmentModel.create({
      title:
        options.title ??
        "Avaliação de teste",

      description:
        "Avaliação criada pela factory de testes.",

      teacherId: toObjectId(
        options.teacherId,
      ),

      classroomId: toObjectId(
        options.classroomId,
      ),

      status,
      questions,

      publishedAt:
        status === "PUBLISHED"
          ? new Date()
          : undefined,

      active: options.active ?? true,
    });

  const questionFixtures:
    AssessmentQuestionFixture[] =
      assessment.questions.map(
        (question) => {
          if (!question._id) {
            throw new Error(
              "A questão criada não possui identificador.",
            );
          }

          const correctAlternative =
            question.alternatives.find(
              (alternative) =>
                alternative.isCorrect,
            );

          const wrongAlternative =
            question.alternatives.find(
              (alternative) =>
                !alternative.isCorrect,
            );

          if (
            !correctAlternative?._id ||
            !wrongAlternative?._id
          ) {
            throw new Error(
              "As alternativas da questão são inválidas.",
            );
          }

          return {
            questionId:
              String(question._id),

            correctAlternativeId:
              String(
                correctAlternative._id,
              ),

            wrongAlternativeId:
              String(
                wrongAlternative._id,
              ),
          };
        },
      );

  return {
    assessment,
    questions: questionFixtures,
  };
}