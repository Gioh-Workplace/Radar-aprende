import bcrypt from "bcryptjs";

import { AppError } from "../errors/app-error";
import { UserModel } from "../models/user.model";
import type { CreateStudentInput } from "../schemas/auth.schema";
import type { PublicUser } from "./auth.service";

const PASSWORD_SALT_ROUNDS = 10;

export async function createStudent(
  input: CreateStudentInput,
  teacherId: string,
): Promise<PublicUser> {
  const registration = input.registration
    .trim()
    .toUpperCase();

  const existingStudent = await UserModel.exists({
    registration,
  });

  if (existingStudent) {
    throw new AppError(
      409,
      "Já existe um aluno com esta matrícula.",
      "REGISTRATION_ALREADY_EXISTS",
    );
  }

  if (bcrypt.truncates(input.password)) {
    throw new AppError(
      400,
      "A senha informada excede o tamanho máximo suportado.",
      "PASSWORD_TOO_LONG",
    );
  }

  const passwordHash = await bcrypt.hash(
    input.password,
    PASSWORD_SALT_ROUNDS,
  );

  const student = await UserModel.create({
    name: input.name.trim(),
    registration,
    passwordHash,
    role: "STUDENT",
    active: true,
    createdBy: teacherId,
  });

  return {
    id: String(student._id),
    name: student.name,
    email: student.email ?? null,
    registration: student.registration ?? null,
    role: student.role,
    active: student.active,
    createdAt: student.createdAt,
  };
}

export async function listTeacherStudents(
    teacherId: string,
  ): Promise<PublicUser[]> {
    const students = await UserModel.find({
      role: "STUDENT",
      createdBy: teacherId,
      active: true,
    }).sort({
      name: 1,
    });
  
    return students.map((student) => ({
      id: String(student._id),
      name: student.name,
      email: student.email ?? null,
      registration: student.registration ?? null,
      role: student.role,
      active: student.active,
      createdAt: student.createdAt,
    }));
  }