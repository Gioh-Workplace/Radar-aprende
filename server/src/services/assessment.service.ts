import {
    AssessmentModel,
    type Assessment,
    type AssessmentStatus,
  } from "../models/assessment.model";
  import { ClassroomModel } from "../models/classroom.model";
  import { AppError } from "../errors/app-error";
  import type { CreateAssessmentInput } from "../schemas/assessment.schema";
  
  export interface PublicAssessment {
    id: string;
    title: string;
    description: string | null;
    classroomId: string;
    teacherId: string;
    status: AssessmentStatus;
    questionCount: number;
    active: boolean;
    createdAt: Date;
  }
  
  function mapAssessment(
    assessment: Assessment & {
      _id: unknown;
    },
  ): PublicAssessment {
    return {
      id: String(assessment._id),
      title: assessment.title,
      description: assessment.description ?? null,
      classroomId: String(assessment.classroomId),
      teacherId: String(assessment.teacherId),
      status: assessment.status,
      questionCount: assessment.questions.length,
      active: assessment.active,
      createdAt: assessment.createdAt,
    };
  }
  
  export async function createAssessmentDraft(
    input: CreateAssessmentInput,
    teacherId: string,
  ): Promise<PublicAssessment> {
    const classroomExists =
      await ClassroomModel.exists({
        _id: input.classroomId,
        teacherId,
        active: true,
      });
  
    if (!classroomExists) {
      throw new AppError(
        404,
        "Turma não encontrada.",
        "CLASSROOM_NOT_FOUND",
      );
    }
  
    const assessment = await AssessmentModel.create({
      title: input.title.trim(),
      description:
        input.description?.trim() || undefined,
      classroomId: input.classroomId,
      teacherId,
      status: "DRAFT",
      questions: [],
      active: true,
    });
  
    return mapAssessment(assessment);
  }
  
  export async function listTeacherAssessments(
    teacherId: string,
    classroomId?: string,
  ): Promise<PublicAssessment[]> {
    const filter: Record<string, unknown> = {
      teacherId,
      active: true,
    };
  
    if (classroomId) {
      filter.classroomId = classroomId;
    }
  
    const assessments = await AssessmentModel.find(
      filter,
    ).sort({
      createdAt: -1,
    });
  
    return assessments.map(mapAssessment);
  }