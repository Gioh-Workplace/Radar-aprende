import {
    Types,
    type HydratedDocument,
  } from "mongoose";
  
  import { AppError } from "../errors/app-error";
  import {
    AssessmentModel,
    type Assessment,
  } from "../models/assessment.model";
  import { ClassroomModel } from "../models/classroom.model";
  import {
    SubmissionModel,
    type Submission,
  } from "../models/submission.model";
  import type { SubmitAssessmentInput } from "../schemas/student-assessment.schema";
  
  type AssessmentDocument =
    HydratedDocument<Assessment>;
  
  type SubmissionDocument =
    HydratedDocument<Submission>;
  
  export interface PublicSubmissionAnswer {
    questionId: string;
    selectedAlternativeId: string;
    skillId: string;
    isCorrect: boolean;
  }
  
  export interface PublicSubmission {
    id: string;
    assessmentId: string;
    classroomId: string;
    studentId: string;
    answers: PublicSubmissionAnswer[];
    correctAnswers: number;
    totalQuestions: number;
    score: number;
    submittedAt: Date;
  }
  
  function mapSubmission(
    submission: SubmissionDocument,
  ): PublicSubmission {
    return {
      id: String(submission._id),
      assessmentId: String(
        submission.assessmentId,
      ),
      classroomId: String(
        submission.classroomId,
      ),
      studentId: String(
        submission.studentId,
      ),
  
      answers: submission.answers.map(
        (answer) => ({
          questionId: String(
            answer.questionId,
          ),
          selectedAlternativeId: String(
            answer.selectedAlternativeId,
          ),
          skillId: String(answer.skillId),
          isCorrect: answer.isCorrect,
        }),
      ),
  
      correctAnswers:
        submission.correctAnswers,
  
      totalQuestions:
        submission.totalQuestions,
  
      score: submission.score,
      submittedAt: submission.submittedAt,
    };
  }
  
  async function getAvailableAssessment(
    assessmentId: string,
    studentId: string,
  ): Promise<AssessmentDocument> {
    const assessment =
      await AssessmentModel.findOne({
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
  
    return assessment;
  }
  
  export async function submitAssessment(
    assessmentId: string,
    input: SubmitAssessmentInput,
    studentId: string,
  ): Promise<PublicSubmission> {
    const existingSubmission =
      await SubmissionModel.exists({
        assessmentId,
        studentId,
      });
  
    if (existingSubmission) {
      throw new AppError(
        409,
        "Esta avaliação já foi respondida.",
        "ASSESSMENT_ALREADY_SUBMITTED",
      );
    }
  
    const assessment =
      await getAvailableAssessment(
        assessmentId,
        studentId,
      );
  
    if (assessment.questions.length === 0) {
      throw new AppError(
        422,
        "A avaliação não possui questões.",
        "ASSESSMENT_WITHOUT_QUESTIONS",
      );
    }
  
    if (
      input.answers.length !==
      assessment.questions.length
    ) {
      throw new AppError(
        422,
        "Todas as questões devem ser respondidas.",
        "INCOMPLETE_ASSESSMENT",
      );
    }
  
    const submittedAnswers = new Map(
      input.answers.map((answer) => [
        answer.questionId,
        answer.selectedAlternativeId,
      ]),
    );
  
    const correctedAnswers =
      assessment.questions.map((question) => {
        const questionId = String(
          question._id,
        );
  
        const selectedAlternativeId =
          submittedAnswers.get(questionId);
  
        if (!selectedAlternativeId) {
          throw new AppError(
            422,
            "Todas as questões devem ser respondidas.",
            "INCOMPLETE_ASSESSMENT",
          );
        }
  
        const selectedAlternative =
          question.alternatives.find(
            (alternative) =>
              String(alternative._id) ===
              selectedAlternativeId,
          );
  
        if (!selectedAlternative) {
          throw new AppError(
            422,
            "Uma alternativa selecionada não pertence à questão informada.",
            "INVALID_SELECTED_ALTERNATIVE",
          );
        }
  
        return {
          questionId: new Types.ObjectId(
            questionId,
          ),
  
          selectedAlternativeId:
            new Types.ObjectId(
              selectedAlternativeId,
            ),
  
          skillId: question.skillId,
  
          isCorrect:
            selectedAlternative.isCorrect,
        };
      });
  
    const submittedQuestionIds = new Set(
      input.answers.map(
        (answer) => answer.questionId,
      ),
    );
  
    const assessmentQuestionIds = new Set(
      assessment.questions.map(
        (question) => String(question._id),
      ),
    );
  
    const containsUnknownQuestion =
      [...submittedQuestionIds].some(
        (questionId) =>
          !assessmentQuestionIds.has(
            questionId,
          ),
      );
  
    if (containsUnknownQuestion) {
      throw new AppError(
        422,
        "Uma ou mais questões não pertencem à avaliação.",
        "INVALID_ASSESSMENT_QUESTION",
      );
    }
  
    const correctAnswers =
      correctedAnswers.filter(
        (answer) => answer.isCorrect,
      ).length;
  
    const totalQuestions =
      assessment.questions.length;
  
    const score = Number(
      (
        (correctAnswers / totalQuestions) *
        100
      ).toFixed(2),
    );
  
    try {
      const submission =
        await SubmissionModel.create({
          assessmentId:
            assessment._id,
  
          classroomId:
            assessment.classroomId,
  
          studentId,
  
          answers: correctedAnswers,
          correctAnswers,
          totalQuestions,
          score,
          submittedAt: new Date(),
        });
  
      return mapSubmission(submission);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new AppError(
          409,
          "Esta avaliação já foi respondida.",
          "ASSESSMENT_ALREADY_SUBMITTED",
        );
      }
  
      throw error;
    }
  }
  
  export async function getStudentSubmission(
    assessmentId: string,
    studentId: string,
  ): Promise<PublicSubmission> {
    await getAvailableAssessment(
      assessmentId,
      studentId,
    );
  
    const submission =
      await SubmissionModel.findOne({
        assessmentId,
        studentId,
      });
  
    if (!submission) {
      throw new AppError(
        404,
        "Submissão não encontrada.",
        "SUBMISSION_NOT_FOUND",
      );
    }
  
    return mapSubmission(submission);
  }