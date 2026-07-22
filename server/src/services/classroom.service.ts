import { AppError } from "../errors/app-error";
import { ClassroomModel } from "../models/classroom.model";
import type { CreateClassroomInput } from "../schemas/classroom.schema";

export interface PublicClassroom {
  id: string;
  name: string;
  subject: string;
  schoolYear: string;
  teacherId: string;
  studentCount: number;
  active: boolean;
  createdAt: Date;
}

export async function createClassroom(
  input: CreateClassroomInput,
  teacherId: string,
): Promise<PublicClassroom> {
  const classroom = await ClassroomModel.create({
    name: input.name.trim(),
    subject: input.subject.trim(),
    schoolYear: input.schoolYear.trim(),
    teacherId,
    studentIds: [],
    active: true,
  });

  return {
    id: String(classroom._id),
    name: classroom.name,
    subject: classroom.subject,
    schoolYear: classroom.schoolYear,
    teacherId: String(classroom.teacherId),
    studentCount: classroom.studentIds.length,
    active: classroom.active,
    createdAt: classroom.createdAt,
  };
}

export async function listTeacherClassrooms(
  teacherId: string,
): Promise<PublicClassroom[]> {
  const classrooms = await ClassroomModel.find({
    teacherId,
    active: true,
  }).sort({
    createdAt: -1,
  });

  return classrooms.map((classroom) => ({
    id: String(classroom._id),
    name: classroom.name,
    subject: classroom.subject,
    schoolYear: classroom.schoolYear,
    teacherId: String(classroom.teacherId),
    studentCount: classroom.studentIds.length,
    active: classroom.active,
    createdAt: classroom.createdAt,
  }));
}

export async function getTeacherClassroomById(
  classroomId: string,
  teacherId: string,
): Promise<PublicClassroom> {
  const classroom = await ClassroomModel.findOne({
    _id: classroomId,
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

  return {
    id: String(classroom._id),
    name: classroom.name,
    subject: classroom.subject,
    schoolYear: classroom.schoolYear,
    teacherId: String(classroom.teacherId),
    studentCount: classroom.studentIds.length,
    active: classroom.active,
    createdAt: classroom.createdAt,
  };
}