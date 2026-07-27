export interface StudentAssessmentSummary {
    id: string;
    title: string;
    description: string | null;
    classroomId: string;
    questionCount: number;
    publishedAt: string | null;
  }
  
  export interface StudentAssessmentAlternative {
    id: string;
    text: string;
  }
  
  export interface StudentAssessmentQuestion {
    id: string;
    statement: string;
    alternatives: StudentAssessmentAlternative[];
  }
  
  export interface StudentAssessmentDetails
    extends StudentAssessmentSummary {
    questions: StudentAssessmentQuestion[];
  }
  
  export interface StudentSubmissionAnswer {
    questionId: string;
    selectedAlternativeId: string;
    skillId: string;
    isCorrect: boolean;
  }
  
  export interface StudentSubmission {
    id: string;
    assessmentId: string;
    classroomId: string;
    studentId: string;
    answers: StudentSubmissionAnswer[];
    correctAnswers: number;
    totalQuestions: number;
    score: number;
    submittedAt: string;
  }
  
  export interface StudentAssessmentsResponse {
    assessments: StudentAssessmentSummary[];
    total: number;
  }
  
  export interface StudentAssessmentResponse {
    assessment: StudentAssessmentDetails;
  }
  
  export interface StudentSubmissionResponse {
    submission: StudentSubmission;
  }
  
  export interface SubmitStudentAssessmentInput {
    answers: Array<{
      questionId: string;
      selectedAlternativeId: string;
    }>;
  }
  
  export interface SubmitStudentAssessmentResponse {
    message: string;
    submission: StudentSubmission;
  }
  
  export interface StudentAssessmentListItem {
    assessment: StudentAssessmentSummary;
    submission: StudentSubmission | null;
  }