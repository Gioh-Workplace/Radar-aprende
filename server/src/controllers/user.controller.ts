import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import { createStudentSchema } from "../schemas/auth.schema";
  import {
    createStudent,
    listTeacherStudents,
  } from "../services/user.service";;
  
  export async function createStudentController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId = request.auth?.userId;
  
      if (!teacherId) {
        throw new AppError(
          401,
          "Usuário não autenticado.",
          "UNAUTHENTICATED",
        );
      }
  
      const input = createStudentSchema.parse(request.body);
  
      const student = await createStudent(
        input,
        teacherId,
      );
  
      response.status(201).json({
        message: "Aluno cadastrado com sucesso.",
        student,
      });
    } catch (error) {
      next(error);
    }
  }

  export async function listStudentsController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId = request.auth?.userId;
  
      if (!teacherId) {
        throw new AppError(
          401,
          "Usuário não autenticado.",
          "UNAUTHENTICATED",
        );
      }
  
      const students =
        await listTeacherStudents(teacherId);
  
      response.status(200).json({
        students,
        total: students.length,
      });
    } catch (error) {
      next(error);
    }
  }