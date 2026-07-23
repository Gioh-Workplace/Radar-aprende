import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import {
    createAssessmentSchema,
    listAssessmentsQuerySchema,
  } from "../schemas/assessment.schema";
  import {
    createAssessmentDraft,
    listTeacherAssessments,
  } from "../services/assessment.service";
  
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
  
  export async function createAssessmentController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const input = createAssessmentSchema.parse(
        request.body,
      );
  
      const assessment =
        await createAssessmentDraft(
          input,
          teacherId,
        );
  
      response.status(201).json({
        message:
          "Avaliação criada como rascunho.",
        assessment,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function listAssessmentsController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const { classroomId } =
        listAssessmentsQuerySchema.parse(
          request.query,
        );
  
      const assessments =
        await listTeacherAssessments(
          teacherId,
          classroomId,
        );
  
      response.status(200).json({
        assessments,
        total: assessments.length,
      });
    } catch (error) {
      next(error);
    }
  }