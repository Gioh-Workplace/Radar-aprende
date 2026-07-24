import type { HydratedDocument } from "mongoose";

import { AppError } from "../errors/app-error";
import {
  AssessmentModel,
  type Assessment,
  type AssessmentQuestion,
} from "../models/assessment.model";
import { ClassroomModel } from "../models/classroom.model";

type AssessmentDocument = HydratedDocument<Assessment>;

export interface StudentAssessmentSummary {
  id: string;
  title: string;
  description: string | null;
  classroomId: string;
  questionCount: number;
  publishedAt: Date | null;
}

export interface StudentAlternative {
  id: string;
  text: string;
}

export interface StudentQuestion {
  id: string;
  statement: string;
  alternatives: StudentAlternative[];
}

export interface StudentAssessmentDetails
  extends StudentAssessmentSummary {
  questions: StudentQuestion[];
}

function mapSummary(
  assessment: AssessmentDocument,
): StudentAssessmentSummary {
  return {
    id: String(assessment._id),
    title: assessment.title,
    description: assessment.description ?? null,
    classroomId: String(assessment.classroomId),
    questionCount: assessment.questions.length,
    publishedAt: assessment.publishedAt ?? null,
  };
}

function mapQuestion(
  question: AssessmentQuestion,
): StudentQuestion {
  return {
    id: String(question._id),
    statement: question.statement,

    alternatives: question.alternatives.map(
      (alternative) => ({
        id: String(alternative._id),
        text: alternative.text,
      }),
    ),
  };
}

export async function listStudentAssessments(
  studentId: string,
): Promise<StudentAssessmentSummary[]> {
  const classrooms = await ClassroomModel.find({
    studentIds: studentId,
    active: true,
  }).select("_id");

  const classroomIds = classrooms.map(
    (classroom) => classroom._id,
  );

  if (classroomIds.length === 0) {
    return [];
  }

  const assessments = await AssessmentModel.find({
    classroomId: {
      $in: classroomIds,
    },
    status: "PUBLISHED",
    active: true,
  }).sort({
    publishedAt: -1,
  });

  return assessments.map(mapSummary);
}

export async function getStudentAssessmentById(
  assessmentId: string,
  studentId: string,
): Promise<StudentAssessmentDetails> {
  const assessment = await AssessmentModel.findOne({
    _id: assessmentId,
    status: "PUBLISHED",
    active: true,
  });

  if (!assessment) {
    throw new AppError(
      404,
      "Avaliação não encontrada.",
      "ASSESSMENT_NOT_FOUND",
    );
  }

  const studentBelongsToClassroom =
    await ClassroomModel.exists({
      _id: assessment.classroomId,
      studentIds: studentId,
      active: true,
    });

  if (!studentBelongsToClassroom) {
    throw new AppError(
      404,
      "Avaliação não encontrada.",
      "ASSESSMENT_NOT_FOUND",
    );
  }

  return {
    ...mapSummary(assessment),
    questions: assessment.questions.map(
      mapQuestion,
    ),
  };
}