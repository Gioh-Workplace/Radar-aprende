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