import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { registerTeacherSchema } from "../schemas/auth.schema";
  import { registerTeacher } from "../services/auth.service";
  
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