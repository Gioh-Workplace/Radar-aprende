import { hash } from "bcryptjs";
import { Types } from "mongoose";

import { UserModel } from "../../models/user.model";

interface TeacherFactoryOptions {
  name?: string;
  email?: string;
  password?: string;
  active?: boolean;
}

interface StudentFactoryOptions {
  createdBy: Types.ObjectId;
  name?: string;
  registration?: string;
  password?: string;
  active?: boolean;
}

export async function createTeacherFactory(
  options: TeacherFactoryOptions = {},
) {
  const password =
    options.password ?? "Professor123";

  const passwordHash = await hash(
    password,
    10,
  );

  const user = await UserModel.create({
    name:
      options.name ??
      "Professora Marina Andrade",

    email:
      options.email ??
      "professora@radaraprende.test",

    passwordHash,
    role: "TEACHER",
    active: options.active ?? true,
  });

  return {
    user,
    password,
  };
}

export async function createStudentFactory(
  options: StudentFactoryOptions,
) {
  const password =
    options.password ?? "Aluno123";

  const passwordHash = await hash(
    password,
    10,
  );

  const user = await UserModel.create({
    name:
      options.name ??
      "Aluno de Teste",

    registration:
      options.registration ??
      "ALUNO001",

    passwordHash,
    role: "STUDENT",

    createdBy:
      options.createdBy,

    active: options.active ?? true,
  });

  return {
    user,
    password,
  };
}