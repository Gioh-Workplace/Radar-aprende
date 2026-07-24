import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import {
    studentAssessmentParamsSchema,
    submitAssessmentSchema,
  } from "../schemas/student-assessment.schema";
  import {
    getStudentAssessmentById,
    listStudentAssessments,
  } from "../services/student-assessment.service";
  import {
    getStudentSubmission,
    submitAssessment,
  } from "../services/submission.service";
  
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

  export async function submitAssessmentController(
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
  
      const input =
        submitAssessmentSchema.parse(
          request.body,
        );
  
      const submission =
        await submitAssessment(
          assessmentId,
          input,
          studentId,
        );
  
      response.status(201).json({
        message:
          "Avaliação enviada com sucesso.",
        submission,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function getSubmissionController(
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
  
      const submission =
        await getStudentSubmission(
          assessmentId,
          studentId,
        );
  
      response.status(200).json({
        submission,
      });
    } catch (error) {
      next(error);
    }
  }