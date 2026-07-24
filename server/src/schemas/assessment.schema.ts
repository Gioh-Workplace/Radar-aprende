import { Types } from "mongoose";
import * as z from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => Types.ObjectId.isValid(value),
    "Identificador inválido.",
  );

const alternativeSchema = z.object({
  text: z.string().trim().min(1).max(300),
  isCorrect: z.boolean(),
});

export const createAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(150),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  classroomId: objectIdSchema,
});

export const listAssessmentsQuerySchema = z.object({
  classroomId: objectIdSchema.optional(),
});

export const assessmentIdParamsSchema = z.object({
  assessmentId: objectIdSchema,
});

export const assessmentQuestionParamsSchema = z.object({
  assessmentId: objectIdSchema,
  questionId: objectIdSchema,
});

export const addAssessmentQuestionSchema = z
  .object({
    statement: z
      .string()
      .trim()
      .min(3)
      .max(1000),

    skillId: objectIdSchema,

    alternatives: z
      .array(alternativeSchema)
      .min(2)
      .max(6),
  })
  .superRefine((input, context) => {
    const correctAlternatives =
      input.alternatives.filter(
        (alternative) => alternative.isCorrect,
      );

    if (correctAlternatives.length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["alternatives"],
        message:
          "A questão deve possuir exatamente uma alternativa correta.",
      });
    }
  });

export type CreateAssessmentInput = z.infer<
  typeof createAssessmentSchema
>;

export type AddAssessmentQuestionInput = z.infer<
  typeof addAssessmentQuestionSchema
>;