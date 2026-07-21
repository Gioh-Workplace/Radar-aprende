import * as z from "zod";

export const registerTeacherSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email(),
  password: z.string().min(8).max(72),
});

export const createStudentSchema = z.object({
  name: z.string().trim().min(2).max(120),

  registration: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/),

  password: z.string().min(6).max(72),
});

export const loginSchema = z.object({
  credential: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(72),
});

export type RegisterTeacherInput = z.infer<
  typeof registerTeacherSchema
>;

export type CreateStudentInput = z.infer<
  typeof createStudentSchema
>;

export type LoginInput = z.infer<typeof loginSchema>;