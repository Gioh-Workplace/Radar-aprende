import { AppError } from "../errors/app-error";
import { AssessmentModel } from "../models/assessment.model";
import { ClassroomModel } from "../models/classroom.model";
import { SkillModel } from "../models/skill.model";
import { SubmissionModel } from "../models/submission.model";
import { UserModel } from "../models/user.model";

export interface AssessmentResultSummary {
  totalStudents: number;
  totalSubmissions: number;
  pendingStudents: number;
  completionRate: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
}

export interface StudentAssessmentResult {
  studentId: string;
  name: string;
  registration: string | null;
  status: "SUBMITTED" | "PENDING";
  correctAnswers: number | null;
  totalQuestions: number;
  score: number | null;
  submittedAt: Date | null;
}

export interface QuestionAssessmentResult {
  questionId: string;
  position: number;
  statement: string;
  skillId: string;
  correctAnswers: number;
  totalAnswers: number;
  accuracyRate: number;
}

export interface SkillAssessmentResult {
  skillId: string;
  name: string;
  subject: string;
  questionCount: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracyRate: number;
}

export interface AssessmentResults {
  assessment: {
    id: string;
    title: string;
    classroomId: string;
    status: string;
    questionCount: number;
  };

  summary: AssessmentResultSummary;
  students: StudentAssessmentResult[];
  questions: QuestionAssessmentResult[];
  skills: SkillAssessmentResult[];
}

function roundToTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

function calculatePercentage(
  value: number,
  total: number,
): number {
  if (total === 0) {
    return 0;
  }

  return roundToTwoDecimals(
    (value / total) * 100,
  );
}

export async function getAssessmentResults(
  assessmentId: string,
  teacherId: string,
): Promise<AssessmentResults> {
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

  if (assessment.status === "DRAFT") {
    throw new AppError(
      409,
      "Os resultados não estão disponíveis para avaliações em rascunho.",
      "ASSESSMENT_RESULTS_NOT_AVAILABLE",
    );
  }

  const classroom = await ClassroomModel.findOne({
    _id: assessment.classroomId,
    teacherId,
    active: true,
  });

  if (!classroom) {
    throw new AppError(
      404,
      "Turma não encontrada.",
      "CLASSROOM_NOT_FOUND",
    );
  }

  const students = await UserModel.find({
    _id: {
      $in: classroom.studentIds,
    },
    role: "STUDENT",
    active: true,
  })
    .select("name registration")
    .sort({
      name: 1,
    });

  const studentIds = students.map(
    (student) => student._id,
  );

  const submissions = await SubmissionModel.find({
    assessmentId: assessment._id,
    studentId: {
      $in: studentIds,
    },
  }).sort({
    submittedAt: 1,
  });

  const submissionByStudentId = new Map(
    submissions.map((submission) => [
      String(submission.studentId),
      submission,
    ]),
  );

  const scores = submissions.map(
    (submission) => submission.score,
  );

  const totalStudents = students.length;
  const totalSubmissions = submissions.length;

  const averageScore =
    scores.length > 0
      ? roundToTwoDecimals(
          scores.reduce(
            (sum, score) => sum + score,
            0,
          ) / scores.length,
        )
      : null;

  const summary: AssessmentResultSummary = {
    totalStudents,
    totalSubmissions,

    pendingStudents:
      totalStudents - totalSubmissions,

    completionRate: calculatePercentage(
      totalSubmissions,
      totalStudents,
    ),

    averageScore,

    highestScore:
      scores.length > 0
        ? Math.max(...scores)
        : null,

    lowestScore:
      scores.length > 0
        ? Math.min(...scores)
        : null,
  };

  const studentResults: StudentAssessmentResult[] =
    students.map((student) => {
      const submission =
        submissionByStudentId.get(
          String(student._id),
        );

      if (!submission) {
        return {
          studentId: String(student._id),
          name: student.name,
          registration:
            student.registration ?? null,
          status: "PENDING",
          correctAnswers: null,
          totalQuestions:
            assessment.questions.length,
          score: null,
          submittedAt: null,
        };
      }

      return {
        studentId: String(student._id),
        name: student.name,
        registration:
          student.registration ?? null,
        status: "SUBMITTED",
        correctAnswers:
          submission.correctAnswers,
        totalQuestions:
          submission.totalQuestions,
        score: submission.score,
        submittedAt:
          submission.submittedAt,
      };
    });

  const questionResults: QuestionAssessmentResult[] =
    assessment.questions.map(
      (question, questionIndex) => {
        const questionId = String(
          question._id,
        );

        let totalAnswers = 0;
        let correctAnswers = 0;

        for (const submission of submissions) {
          const answer = submission.answers.find(
            (submissionAnswer) =>
              String(
                submissionAnswer.questionId,
              ) === questionId,
          );

          if (!answer) {
            continue;
          }

          totalAnswers += 1;

          if (answer.isCorrect) {
            correctAnswers += 1;
          }
        }

        return {
          questionId,
          position: questionIndex + 1,
          statement: question.statement,
          skillId: String(question.skillId),
          correctAnswers,
          totalAnswers,

          accuracyRate: calculatePercentage(
            correctAnswers,
            totalAnswers,
          ),
        };
      },
    );

  const skillIds = [
    ...new Set(
      assessment.questions.map((question) =>
        String(question.skillId),
      ),
    ),
  ];

  const skills = await SkillModel.find({
    _id: {
      $in: skillIds,
    },
    teacherId,
    active: true,
  }).select("name subject");

  const skillById = new Map(
    skills.map((skill) => [
      String(skill._id),
      skill,
    ]),
  );

  const skillResults: SkillAssessmentResult[] =
    skillIds.map((skillId) => {
      const skill = skillById.get(skillId);

      const skillQuestions =
        assessment.questions.filter(
          (question) =>
            String(question.skillId) ===
            skillId,
        );

      let totalAnswers = 0;
      let correctAnswers = 0;

      for (const submission of submissions) {
        for (const answer of submission.answers) {
          if (
            String(answer.skillId) !== skillId
          ) {
            continue;
          }

          totalAnswers += 1;

          if (answer.isCorrect) {
            correctAnswers += 1;
          }
        }
      }

      return {
        skillId,
        name:
          skill?.name ??
          "Habilidade indisponível",

        subject:
          skill?.subject ??
          "Não informado",

        questionCount:
          skillQuestions.length,

        correctAnswers,
        totalAnswers,

        accuracyRate: calculatePercentage(
          correctAnswers,
          totalAnswers,
        ),
      };
    });

  skillResults.sort(
    (firstSkill, secondSkill) =>
      firstSkill.accuracyRate -
      secondSkill.accuracyRate,
  );

  return {
    assessment: {
      id: String(assessment._id),
      title: assessment.title,
      classroomId: String(
        assessment.classroomId,
      ),
      status: assessment.status,
      questionCount:
        assessment.questions.length,
    },

    summary,
    students: studentResults,
    questions: questionResults,
    skills: skillResults,
  };
}