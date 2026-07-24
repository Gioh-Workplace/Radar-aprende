import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import { studentAssessmentParamsSchema } from "../schemas/student-assessment.schema";
  import {
    getStudentAssessmentById,
    listStudentAssessments,
  } from "../services/student-assessment.service";
  
  function getAuthenticatedStudentId(
    request: Request,
  ): string {
    const studentId = request.auth?.userId;
  
    if (!studentId) {
      throw new AppError(
        401,
        "Usuário não autenticado.",
        "UNAUTHENTICATED",
      );
    }
  
    return studentId;
  }
  
  export async function listStudentAssessmentsController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const studentId =
        getAuthenticatedStudentId(request);
  
      const assessments =
        await listStudentAssessments(studentId);
  
      response.status(200).json({
        assessments,
        total: assessments.length,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function getStudentAssessmentController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const studentId =
        getAuthenticatedStudentId(request);
  
      const { assessmentId } =
        studentAssessmentParamsSchema.parse(
          request.params,
        );
  
      const assessment =
        await getStudentAssessmentById(
          assessmentId,
          studentId,
        );
  
      response.status(200).json({
        assessment,
      });
    } catch (error) {
      next(error);
    }
  }