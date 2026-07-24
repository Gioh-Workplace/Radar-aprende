import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { AppError } from "../errors/app-error";
import {
  addAssessmentQuestionSchema,
  assessmentIdParamsSchema,
  assessmentQuestionParamsSchema,
  createAssessmentSchema,
  listAssessmentsQuerySchema,
} from "../schemas/assessment.schema";
import {
  addAssessmentQuestion,
  createAssessmentDraft,
  getTeacherAssessmentById,
  listTeacherAssessments,
  publishAssessment,
  removeAssessmentQuestion,
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

export async function getAssessmentController(
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

    const assessment =
      await getTeacherAssessmentById(
        assessmentId,
        teacherId,
      );

    response.status(200).json({
      assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function addQuestionController(
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

    const input =
      addAssessmentQuestionSchema.parse(
        request.body,
      );

    const assessment =
      await addAssessmentQuestion(
        assessmentId,
        input,
        teacherId,
      );

    response.status(201).json({
      message:
        "Questão adicionada com sucesso.",
      assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeQuestionController(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const teacherId =
      getAuthenticatedTeacherId(request);

    const {
      assessmentId,
      questionId,
    } = assessmentQuestionParamsSchema.parse(
      request.params,
    );

    const assessment =
      await removeAssessmentQuestion(
        assessmentId,
        questionId,
        teacherId,
      );

    response.status(200).json({
      message:
        "Questão removida com sucesso.",
      assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishAssessmentController(
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

    const assessment = await publishAssessment(
      assessmentId,
      teacherId,
    );

    response.status(200).json({
      message: "Avaliação publicada com sucesso.",
      assessment,
    });
  } catch (error) {
    next(error);
  }
}