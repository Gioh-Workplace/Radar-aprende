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

export async function publishAssessment(
  assessmentId: string,
  teacherId: string,
): Promise<PublicAssessmentDetails> {
  const assessment = await findTeacherAssessment(
    assessmentId,
    teacherId,
  );

  ensureAssessmentIsDraft(assessment);

  const classroomExists = await ClassroomModel.exists({
    _id: assessment.classroomId,
    teacherId,
    active: true,
  });

  if (!classroomExists) {
    throw new AppError(
      404,
      "A turma vinculada à avaliação não foi encontrada.",
      "CLASSROOM_NOT_FOUND",
    );
  }

  if (assessment.questions.length === 0) {
    throw new AppError(
      422,
      "A avaliação precisa possuir pelo menos uma questão.",
      "ASSESSMENT_WITHOUT_QUESTIONS",
    );
  }

  for (const question of assessment.questions) {
    if (
      question.alternatives.length < 2 ||
      question.alternatives.length > 6
    ) {
      throw new AppError(
        422,
        "Todas as questões devem possuir entre duas e seis alternativas.",
        "INVALID_ALTERNATIVES_COUNT",
      );
    }

    const correctAlternatives =
      question.alternatives.filter(
        (alternative) => alternative.isCorrect,
      );

    if (correctAlternatives.length !== 1) {
      throw new AppError(
        422,
        "Todas as questões devem possuir exatamente uma alternativa correta.",
        "INVALID_CORRECT_ALTERNATIVES_COUNT",
      );
    }
  }

  const skillIds = [
    ...new Set(
      assessment.questions.map((question) =>
        String(question.skillId),
      ),
    ),
  ];

  const validSkillsCount = await SkillModel.countDocuments({
    _id: {
      $in: skillIds,
    },
    teacherId,
    active: true,
  });

  if (validSkillsCount !== skillIds.length) {
    throw new AppError(
      422,
      "Uma ou mais habilidades vinculadas à avaliação não estão disponíveis.",
      "INVALID_ASSESSMENT_SKILLS",
    );
  }

  assessment.status = "PUBLISHED";
  assessment.publishedAt = new Date();

  await assessment.save();

  return mapAssessmentDetails(assessment);
}