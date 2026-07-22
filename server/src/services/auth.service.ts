import bcrypt from "bcryptjs";
import jwt, {
    type Secret,
    type SignOptions,
  } from "jsonwebtoken";
  

import { AppError } from "../errors/app-error";
import { UserModel } from "../models/user.model";
import type {
    LoginInput,
    RegisterTeacherInput,
  } from "../schemas/auth.schema";

const PASSWORD_SALT_ROUNDS = 10;

function getJwtSecret(): Secret {
    const secret = process.env.JWT_SECRET;
  
    if (!secret) {
      throw new Error("JWT_SECRET is not defined.");
    }
  
    return secret;
  }
  
  function createAccessToken(
    userId: string,
    role: "TEACHER" | "STUDENT",
  ): string {
    const expiresIn =
      (process.env.JWT_EXPIRES_IN ??
        "1d") as SignOptions["expiresIn"];
  
    return jwt.sign(
      {
        role,
      },
      getJwtSecret(),
      {
        subject: userId,
        expiresIn,
      },
    );
  }

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

export interface LoginResult {
    token: string;
    user: PublicUser;
  }
  
  export async function login(
    input: LoginInput,
  ): Promise<LoginResult> {
    const credential = input.credential.trim();
    const normalizedEmail = credential.toLowerCase();
    const normalizedRegistration = credential.toUpperCase();
  
    const user = await UserModel.findOne({
      $or: [
        { email: normalizedEmail },
        { registration: normalizedRegistration },
      ],
    }).select("+passwordHash");
  
    if (!user) {
      throw new AppError(
        401,
        "Credencial ou senha inválida.",
        "INVALID_CREDENTIALS",
      );
    }
  
    if (!user.active) {
      throw new AppError(
        403,
        "Este usuário está desativado.",
        "USER_INACTIVE",
      );
    }
  
    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
  
    if (!passwordMatches) {
      throw new AppError(
        401,
        "Credencial ou senha inválida.",
        "INVALID_CREDENTIALS",
      );
    }
  
    const token = createAccessToken(
      String(user._id),
      user.role,
    );
  
    return {
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email ?? null,
        registration: user.registration ?? null,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
      },
    };
  }
  export async function getCurrentUser(
    userId: string,
  ): Promise<PublicUser> {
    const user = await UserModel.findById(userId);
  
    if (!user || !user.active) {
      throw new AppError(
        404,
        "Usuário não encontrado.",
        "USER_NOT_FOUND",
      );
    }
  
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