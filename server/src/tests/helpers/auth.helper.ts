import request from "supertest";

import { app } from "../../app";

export interface TeacherRegistrationInput {
  name: string;
  email: string;
  password: string;
}

export const defaultTeacherRegistration:
  TeacherRegistrationInput = {
    name: "Professora Marina Andrade",
    email: "marina@radaraprende.test",
    password: "Professor123",
  };

export function registerTeacher(
  input: TeacherRegistrationInput =
    defaultTeacherRegistration,
) {
  return request(app)
    .post("/auth/register")
    .send(input);
}

export function loginUser(
  credential: string,
  password: string,
) {
  return request(app)
    .post("/auth/login")
    .send({
      credential,
      password,
    });
}

export async function getTeacherToken(): Promise<string> {
  await registerTeacher();

  const loginResponse = await loginUser(
    defaultTeacherRegistration.email,
    defaultTeacherRegistration.password,
  );

  const token: unknown =
    loginResponse.body.token;

  if (typeof token !== "string") {
    throw new Error(
      "O login não retornou um token válido.",
    );
  }

  return token;
}