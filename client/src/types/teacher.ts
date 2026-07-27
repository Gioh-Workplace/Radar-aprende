export interface TeacherClassroom {
    id: string;
    name: string;
    subject: string;
    schoolYear: string;
    teacherId: string;
    studentCount: number;
    active: boolean;
    createdAt: string;
  }

  export interface CreateTeacherClassroomInput {
    name: string;
    subject: string;
    schoolYear: string;
  }
  
  export interface CreateTeacherClassroomResponse {
    message: string;
    classroom: TeacherClassroom;
  }
  
  export interface TeacherStudent {
    id: string;
    name: string;
    email: string | null;
    registration: string | null;
    role: "STUDENT";
    active: boolean;
    createdAt: string;
  }
  
  export type AssessmentStatus =
    | "DRAFT"
    | "PUBLISHED"
    | "CLOSED";
  
  export interface TeacherAssessment {
    id: string;
    title: string;
    description: string | null;
    classroomId: string;
    teacherId: string;
    status: AssessmentStatus;
    questionCount: number;
    active: boolean;
    createdAt: string;
  }
  
  export interface ClassroomsResponse {
    classrooms: TeacherClassroom[];
    total: number;
  }
  
  export interface StudentsResponse {
    students: TeacherStudent[];
    total: number;
  }
  
  export interface AssessmentsResponse {
    assessments: TeacherAssessment[];
    total: number;
  }

  export interface TeacherClassroomStudent {
    id: string;
    name: string;
    registration: string | null;
    active: boolean;
  }
  
  export interface TeacherClassroomDetails
    extends TeacherClassroom {
    students: TeacherClassroomStudent[];
  }
  
  export interface ClassroomResponse {
    classroom: TeacherClassroomDetails;
  }

  export interface ClassroomMutationResponse {
    message: string;
    classroom: TeacherClassroomDetails;
  }

  export interface CreateTeacherStudentInput {
    name: string;
    registration: string;
    password: string;
  }
  
  export interface CreateTeacherStudentResponse {
    message: string;
    student: TeacherStudent;
  }

  export interface TeacherSkill {
    id: string;
    name: string;
    description: string | null;
    subject: string;
    teacherId: string;
    active: boolean;
    createdAt: string;
  }
  
  export interface SkillsResponse {
    skills: TeacherSkill[];
    total: number;
  }
  
  export interface CreateTeacherSkillInput {
    name: string;
    subject: string;
    description?: string;
  }
  
  export interface CreateTeacherSkillResponse {
    message: string;
    skill: TeacherSkill;
  }

  export interface CreateTeacherAssessmentInput {
    title: string;
    description?: string;
    classroomId: string;
  }
  
  export interface CreateTeacherAssessmentResponse {
    message: string;
    assessment: TeacherAssessment;
  }

  export interface TeacherAssessmentAlternative {
    id: string;
    text: string;
    isCorrect: boolean;
  }
  
  export interface TeacherAssessmentQuestion {
    id: string;
    statement: string;
    skillId: string;
    alternatives: TeacherAssessmentAlternative[];
  }
  
  export interface TeacherAssessmentDetails
    extends TeacherAssessment {
    questions: TeacherAssessmentQuestion[];
    publishedAt: string | null;
  }
  
  export interface AssessmentResponse {
    assessment: TeacherAssessmentDetails;
  }
  
  export interface AddTeacherAssessmentQuestionInput {
    statement: string;
    skillId: string;
  
    alternatives: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  }
  
  export interface AssessmentMutationResponse {
    message: string;
    assessment: TeacherAssessmentDetails;
  }

  export type TeacherClassroomListStatus =
  | "active"
  | "archived"
  | "all";

  export type TeacherResultStudentStatus =
  | "SUBMITTED"
  | "PENDING";

export type SkillPerformanceLevel =
  | "CRITICAL"
  | "DEVELOPING"
  | "CONSOLIDATED"
  | "NO_DATA";

  

export interface TeacherAssessmentResultSummary {
  totalStudents: number;
  totalSubmissions: number;
  pendingStudents: number;
  completionRate: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
}

export interface TeacherStudentAssessmentResult {
  studentId: string;
  name: string;
  registration: string | null;
  status: TeacherResultStudentStatus;
  correctAnswers: number | null;
  totalQuestions: number;
  score: number | null;
  submittedAt: string | null;
}

export interface TeacherQuestionAssessmentResult {
  questionId: string;
  position: number;
  statement: string;
  skillId: string;
  correctAnswers: number;
  totalAnswers: number;
  accuracyRate: number;
}

export interface TeacherSkillAssessmentResult {
  skillId: string;
  name: string;
  subject: string;
  questionCount: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracyRate: number;
  level: SkillPerformanceLevel;
}

export interface TeacherPedagogicalRecommendation {
  skillId: string;
  skillName: string;
  level: SkillPerformanceLevel;
  accuracyRate: number;
  priority: number;
  title: string;
  description: string;
  actions: string[];
}

export interface TeacherRecommendationSummary {
  criticalSkills: number;
  developingSkills: number;
  consolidatedSkills: number;
  skillsWithoutData: number;
}

export interface TeacherAssessmentResults {
  assessment: {
    id: string;
    title: string;
    classroomId: string;
    status: AssessmentStatus;
    questionCount: number;
  };

  summary: TeacherAssessmentResultSummary;
  students: TeacherStudentAssessmentResult[];
  questions: TeacherQuestionAssessmentResult[];
  skills: TeacherSkillAssessmentResult[];
  recommendationSummary: TeacherRecommendationSummary;
  recommendations: TeacherPedagogicalRecommendation[];
}

export interface TeacherAssessmentResultsResponse {
  results: TeacherAssessmentResults;
}