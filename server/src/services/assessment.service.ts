import {
  Types,
  type HydratedDocument,
} from "mongoose";

import { AppError } from "../errors/app-error";
import {
  AssessmentModel,
  type Assessment,
  type AssessmentQuestion,
  type AssessmentStatus,
} from "../models/assessment.model";
import { ClassroomModel } from "../models/classroom.model";
import { SkillModel } from "../models/skill.model";
import type {
  AddAssessmentQuestionInput,
  CreateAssessmentInput,
} from "../schemas/assessment.schema";

type AssessmentDocument =
  HydratedDocument<Assessment>;

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

export interface PublicAssessmentAlternative {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface PublicAssessmentQuestion {
  id: string;
  statement: string;
  skillId: string;
  alternatives: PublicAssessmentAlternative[];
}

export interface PublicAssessmentDetails
  extends PublicAssessment {
  questions: PublicAssessmentQuestion[];
  publishedAt: Date | null;
}

function mapAssessment(
  assessment: AssessmentDocument,
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

function mapQuestion(
  question: AssessmentQuestion,
): PublicAssessmentQuestion {
  return {
    id: String(question._id),
    statement: question.statement,
    skillId: String(question.skillId),

    alternatives: question.alternatives.map(
      (alternative) => ({
        id: String(alternative._id),
        text: alternative.text,
        isCorrect: alternative.isCorrect,
      }),
    ),
  };
}

function mapAssessmentDetails(
  assessment: AssessmentDocument,
): PublicAssessmentDetails {
  return {
    ...mapAssessment(assessment),

    questions: assessment.questions.map(
      mapQuestion,
    ),

    publishedAt:
      assessment.publishedAt ?? null,
  };
}

async function findTeacherAssessment(
  assessmentId: string,
  teacherId: string,
): Promise<AssessmentDocument> {
  const assessment = await AssessmentModel.findOne({
    _id: assessmentId,
    teacherId,
    active: true,
  });

  if (!assessment) {
    throw new AppError(
      404,
      "Avaliação não encontrada.",
      "ASSESSMENT_NOT_FOUND",
    );
  }

  return assessment;
}

function ensureAssessmentIsDraft(
  assessment: AssessmentDocument,
): void {
  if (assessment.status !== "DRAFT") {
    throw new AppError(
      409,
      "Somente avaliações em rascunho podem ser alteradas.",
      "ASSESSMENT_NOT_DRAFT",
    );
  }
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

export async function getTeacherAssessmentById(
  assessmentId: string,
  teacherId: string,
): Promise<PublicAssessmentDetails> {
  const assessment = await findTeacherAssessment(
    assessmentId,
    teacherId,
  );

  return mapAssessmentDetails(assessment);
}

export async function addAssessmentQuestion(
  assessmentId: string,
  input: AddAssessmentQuestionInput,
  teacherId: string,
): Promise<PublicAssessmentDetails> {
  const assessment = await findTeacherAssessment(
    assessmentId,
    teacherId,
  );

  ensureAssessmentIsDraft(assessment);

  const skillExists = await SkillModel.exists({
    _id: input.skillId,
    teacherId,
    active: true,
  });

  if (!skillExists) {
    throw new AppError(
      404,
      "Habilidade não encontrada.",
      "SKILL_NOT_FOUND",
    );
  }

  assessment.questions.push({
    statement: input.statement.trim(),

    skillId: new Types.ObjectId(
      input.skillId,
    ),

    alternatives: input.alternatives.map(
      (alternative) => ({
        text: alternative.text.trim(),
        isCorrect: alternative.isCorrect,
      }),
    ),
  });

  await assessment.save();

  return mapAssessmentDetails(assessment);
}

export async function removeAssessmentQuestion(
  assessmentId: string,
  questionId: string,
  teacherId: string,
): Promise<PublicAssessmentDetails> {
  const assessment = await findTeacherAssessment(
    assessmentId,
    teacherId,
  );

  ensureAssessmentIsDraft(assessment);

  const questionExists =
    assessment.questions.some(
      (question) =>
        String(question._id) === questionId,
    );

  if (!questionExists) {
    throw new AppError(
      404,
      "Questão não encontrada.",
      "QUESTION_NOT_FOUND",
    );
  }

  assessment.questions =
    assessment.questions.filter(
      (question) =>
        String(question._id) !== questionId,
    );

  await assessment.save();

  return mapAssessmentDetails(assessment);
}