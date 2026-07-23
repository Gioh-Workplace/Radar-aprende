import { Types } from "mongoose";
import * as z from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => Types.ObjectId.isValid(value),
    "Identificador inválido.",
  );

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

export type CreateAssessmentInput = z.infer<
  typeof createAssessmentSchema
>;