import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import {
    addStudentToClassroomSchema,
    classroomIdParamsSchema,
    classroomStudentParamsSchema,
    createClassroomSchema,
    listClassroomsQuerySchema,
    updateClassroomStatusSchema,
  } from "../schemas/classroom.schema";
  import {
    addStudentToClassroom,
    createClassroom,
    getTeacherClassroomById,
    listTeacherClassrooms,
    removeStudentFromClassroom,
    updateClassroomStatus,
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
        getAuthenticatedTeacherId(
          request,
        );
  
      const { status } =
        listClassroomsQuerySchema.parse(
          request.query,
        );
  
      const classrooms =
        await listTeacherClassrooms(
          teacherId,
          status,
        );
  
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

  export async function addStudentController(
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
  
      const { studentId } =
        addStudentToClassroomSchema.parse(
          request.body,
        );
  
      const classroom =
        await addStudentToClassroom(
          classroomId,
          studentId,
          teacherId,
        );
  
      response.status(200).json({
        message: "Aluno adicionado à turma com sucesso.",
        classroom,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function removeStudentController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const {
        classroomId,
        studentId,
      } = classroomStudentParamsSchema.parse(
        request.params,
      );
  
      const classroom =
        await removeStudentFromClassroom(
          classroomId,
          studentId,
          teacherId,
        );
  
      response.status(200).json({
        message: "Aluno removido da turma com sucesso.",
        classroom,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function updateClassroomStatusController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(
          request,
        );
  
      const { classroomId } =
        classroomIdParamsSchema.parse(
          request.params,
        );
  
      const { active } =
        updateClassroomStatusSchema.parse(
          request.body,
        );
  
      const classroom =
        await updateClassroomStatus(
          classroomId,
          teacherId,
          active,
        );
  
      response.status(200).json({
        message: active
          ? "Turma restaurada com sucesso."
          : "Turma arquivada com sucesso.",
        classroom,
      });
    } catch (error) {
      next(error);
    }
  }