import { Types } from "mongoose";
import * as z from "zod";

const objectIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => Types.ObjectId.isValid(value),
    "Identificador inválido.",
  );

export const createClassroomSchema = z.object({
  name: z.string().trim().min(2).max(100),
  subject: z.string().trim().min(2).max(100),
  schoolYear: z.string().trim().min(2).max(40),
});

export const listClassroomsQuerySchema =
  z.object({
    status: z
      .enum([
        "active",
        "archived",
        "all",
      ])
      .default("active"),
  });

export const updateClassroomStatusSchema =
  z.object({
    active: z.boolean(),
  });

export const classroomIdParamsSchema = z.object({
  classroomId: objectIdSchema,
});

export const addStudentToClassroomSchema = z.object({
    studentId: objectIdSchema,
  });
  
  export const classroomStudentParamsSchema = z.object({
    classroomId: objectIdSchema,
    studentId: objectIdSchema,
  });

export type CreateClassroomInput = z.infer<
  typeof createClassroomSchema
>;

export type ClassroomListStatus =
  z.infer<
    typeof listClassroomsQuerySchema
  >["status"];