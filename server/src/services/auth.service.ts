import bcrypt from "bcryptjs";

import { AppError } from "../errors/app-error";
import { UserModel } from "../models/user.model";
import type { RegisterTeacherInput } from "../schemas/auth.schema";

const PASSWORD_SALT_ROUNDS = 10;

export interface PublicUser {
  id: string;
  name: string;
  email: string | null;
  registration: string | null;
  role: "TEACHER" | "STUDENT";
  active: boolean;
  createdAt: Date;
}

export async function registerTeacher(
  input: RegisterTeacherInput,
): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();

  const existingUser = await UserModel.exists({ email });

  if (existingUser) {
    throw new AppError(
      409,
      "Já existe um usuário cadastrado com este e-mail.",
      "EMAIL_ALREADY_EXISTS",
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

  const user = await UserModel.create({
    name: input.name.trim(),
    email,
    passwordHash,
    role: "TEACHER",
    active: true,
  });

  return {
    id: String(user._id),
    name: user.name,
    email: user.email ?? null,
    registration: user.registration ?? null,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}