import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import {
    classroomIdParamsSchema,
    createClassroomSchema,
  } from "../schemas/classroom.schema";
  import {
    createClassroom,
    getTeacherClassroomById,
    listTeacherClassrooms,
  } from "../services/classroom.service";
  
  function getAuthenticatedTeacherId(
    request: Request,
  ): string {
    const teacherId = request.auth?.userId;
  
    if (!teacherId) {
      throw new AppError(
        401,
        "Usuário não autenticado.",
        "UNAUTHENTICATED",
      );
    }
  
    return teacherId;
  }
  
  export async function createClassroomController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const input = createClassroomSchema.parse(
        request.body,
      );
  
      const classroom = await createClassroom(
        input,
        teacherId,
      );
  
      response.status(201).json({
        message: "Turma criada com sucesso.",
        classroom,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function listClassroomsController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const classrooms =
        await listTeacherClassrooms(teacherId);
  
      response.status(200).json({
        classrooms,
        total: classrooms.length,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function getClassroomController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const { classroomId } =
        classroomIdParamsSchema.parse(
          request.params,
        );
  
      const classroom =
        await getTeacherClassroomById(
          classroomId,
          teacherId,
        );
  
      response.status(200).json({
        classroom,
      });
    } catch (error) {
      next(error);
    }
  }