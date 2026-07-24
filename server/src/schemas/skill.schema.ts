import { Types } from "mongoose";
import * as z from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => Types.ObjectId.isValid(value),
    "Identificador inválido.",
  );

export const createSkillSchema = z.object({
  name: z.string().trim().min(2).max(120),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  subject: z.string().trim().min(2).max(100),
});

export const skillIdParamsSchema = z.object({
  skillId: objectIdSchema,
});

export const listSkillsQuerySchema = z.object({
  subject: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),
});

export type CreateSkillInput = z.infer<
  typeof createSkillSchema
>;