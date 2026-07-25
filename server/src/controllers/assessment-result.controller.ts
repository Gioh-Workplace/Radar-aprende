import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import { assessmentIdParamsSchema } from "../schemas/assessment.schema";
  import { getAssessmentResults } from "../services/assessment-result.service";
  
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
  
  export async function getAssessmentResultsController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const { assessmentId } =
        assessmentIdParamsSchema.parse(
          request.params,
        );
  
      const results =
        await getAssessmentResults(
          assessmentId,
          teacherId,
        );
  
      response.status(200).json({
        results,
      });
    } catch (error) {
      next(error);
    }
  }