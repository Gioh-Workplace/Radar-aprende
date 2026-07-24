import { Types } from "mongoose";
import * as z from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => Types.ObjectId.isValid(value),
    "Identificador inválido.",
  );

export const studentAssessmentParamsSchema =
  z.object({
    assessmentId: objectIdSchema,
  });

const submissionAnswerSchema = z.object({
  questionId: objectIdSchema,
  selectedAlternativeId: objectIdSchema,
});

export const submitAssessmentSchema = z
  .object({
    answers: z
      .array(submissionAnswerSchema)
      .min(1),
  })
  .superRefine((input, context) => {
    const questionIds = input.answers.map(
      (answer) => answer.questionId,
    );

    const uniqueQuestionIds =
      new Set(questionIds);

    if (
      uniqueQuestionIds.size !==
      questionIds.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["answers"],
        message:
          "Cada questão pode ser respondida apenas uma vez.",
      });
    }
  });

export type SubmitAssessmentInput = z.infer<
  typeof submitAssessmentSchema
>;