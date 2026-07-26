import { apiRequest } from "../lib/api";
import type {
    AssessmentsResponse,
    ClassroomMutationResponse,
    ClassroomResponse,
    ClassroomsResponse,
    CreateTeacherStudentInput,
    CreateTeacherStudentResponse,
    StudentsResponse,
    TeacherAssessment,
    TeacherClassroom,
    TeacherClassroomDetails,
    TeacherStudent,
    CreateTeacherSkillInput,
    CreateTeacherSkillResponse,
    SkillsResponse,
    TeacherSkill,
    CreateTeacherAssessmentInput,
    CreateTeacherAssessmentResponse,
  } from "../types/teacher";

export async function getTeacherClassrooms():
Promise<TeacherClassroom[]> {
  const response =
    await apiRequest<ClassroomsResponse>(
      "/classrooms",
    );

  return response.classrooms;
}

export async function getTeacherStudents():
Promise<TeacherStudent[]> {
  const response =
    await apiRequest<StudentsResponse>(
      "/users/students",
    );

  return response.students;
}

export async function getTeacherAssessments():
Promise<TeacherAssessment[]> {
  const response =
    await apiRequest<AssessmentsResponse>(
      "/assessments",
    );

  return response.assessments;
}

export async function getTeacherClassroom(
    classroomId: string,
  ): Promise<TeacherClassroomDetails> {
    const response =
      await apiRequest<ClassroomResponse>(
        `/classrooms/${classroomId}`,
      );
  
    return response.classroom;
  }

export async function addTeacherStudentToClassroom(
    classroomId: string,
    studentId: string,
  ): Promise<TeacherClassroomDetails> {
    const response =
      await apiRequest<ClassroomMutationResponse>(
        `/classrooms/${classroomId}/students`,
        {
          method: "POST",
          body: JSON.stringify({
            studentId,
          }),
        },
      );
  
    return response.classroom;
  }
  
export async function removeTeacherStudentFromClassroom(
    classroomId: string,
    studentId: string,
  ): Promise<TeacherClassroomDetails> {
    const response =
      await apiRequest<ClassroomMutationResponse>(
        `/classrooms/${classroomId}/students/${studentId}`,
        {
          method: "DELETE",
        },
      );
  
    return response.classroom;
  }

  export async function createTeacherStudent(
    input: CreateTeacherStudentInput,
  ): Promise<TeacherStudent> {
    const response =
      await apiRequest<CreateTeacherStudentResponse>(
        "/users/students",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );
  
    return response.student;
  }

  export async function getTeacherSkills():
Promise<TeacherSkill[]> {
  const response =
    await apiRequest<SkillsResponse>(
      "/skills",
    );

  return response.skills;
}

export async function createTeacherSkill(
  input: CreateTeacherSkillInput,
): Promise<TeacherSkill> {
  const response =
    await apiRequest<CreateTeacherSkillResponse>(
      "/skills",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.skill;
}

export async function createTeacherAssessment(
  input: CreateTeacherAssessmentInput,
): Promise<TeacherAssessment> {
  const response =
    await apiRequest<CreateTeacherAssessmentResponse>(
      "/assessments",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );

  return response.assessment;
}