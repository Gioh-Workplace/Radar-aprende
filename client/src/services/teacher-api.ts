import { apiRequest } from "../lib/api";
import type {
    AssessmentsResponse,
    ClassroomResponse,
    ClassroomsResponse,
    StudentsResponse,
    TeacherAssessment,
    TeacherClassroom,
    TeacherClassroomDetails,
    TeacherStudent,
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