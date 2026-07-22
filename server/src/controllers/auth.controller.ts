import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import {
    loginSchema,
    registerTeacherSchema,
  } from "../schemas/auth.schema";
  import {
    getCurrentUser,
    login,
    registerTeacher,
  } from "../services/auth.service";
  
  export async function registerTeacherController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = registerTeacherSchema.parse(request.body);
      const user = await registerTeacher(input);
  
      response.status(201).json({
        message: "Professor cadastrado com sucesso.",
        user,
      });
    } catch (error) {
      next(error);
    }
  }
  export async function loginController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const input = loginSchema.parse(request.body);
      const result = await login(input);
  
      response.status(200).json({
        message: "Login realizado com sucesso.",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function meController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = request.auth?.userId;
  
      if (!userId) {
        throw new AppError(
          401,
          "Usuário não autenticado.",
          "UNAUTHENTICATED",
        );
      }
  
      const user = await getCurrentUser(userId);
  
      response.status(200).json({
        user,
      });
    } catch (error) {
      next(error);
    }
  }