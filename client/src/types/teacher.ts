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