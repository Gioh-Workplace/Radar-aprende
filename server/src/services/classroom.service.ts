import { AppError } from "../errors/app-error";
import { ClassroomModel } from "../models/classroom.model";
import type { 
  ClassroomListStatus,
  CreateClassroomInput,
 } from "../schemas/classroom.schema";
import { UserModel } from "../models/user.model";


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
export interface PublicClassroomStudent {
    id: string;
    name: string;
    registration: string | null;
    active: boolean;
  }
  
  export interface PublicClassroomDetails
    extends PublicClassroom {
    students: PublicClassroomStudent[];
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
  status: ClassroomListStatus = "active",
): Promise<PublicClassroom[]> {
  const activeFilter =
    status === "all"
      ? {}
      : {
          active:
            status === "active",
        };

  const classrooms =
    await ClassroomModel.find({
      teacherId,
      ...activeFilter,
    }).sort({
      active: -1,
      createdAt: -1,
    });

  return classrooms.map(
    (classroom) => ({
      id: String(classroom._id),
      name: classroom.name,
      subject: classroom.subject,
      schoolYear: classroom.schoolYear,
      teacherId: String(
        classroom.teacherId,
      ),
      studentCount:
        classroom.studentIds.length,
      active: classroom.active,
      createdAt: classroom.createdAt,
    }),
  );
}

export async function getTeacherClassroomById(
    classroomId: string,
    teacherId: string,
  ): Promise<PublicClassroomDetails> {
    const classroom = await ClassroomModel.findOne({
      _id: classroomId,
      teacherId,
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
    }).sort({
      name: 1,
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
      students: students.map((student) => ({
        id: String(student._id),
        name: student.name,
        registration:
          student.registration ?? null,
        active: student.active,
      })),
    };


    
  }

  export async function addStudentToClassroom(
    classroomId: string,
    studentId: string,
    teacherId: string,
  ): Promise<PublicClassroomDetails> {
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
  
    const student = await UserModel.findOne({
      _id: studentId,
      role: "STUDENT",
      createdBy: teacherId,
      active: true,
    });
  
    if (!student) {
      throw new AppError(
        404,
        "Aluno não encontrado.",
        "STUDENT_NOT_FOUND",
      );
    }
  
    const studentAlreadyAdded =
      classroom.studentIds.some((currentStudentId) =>
        currentStudentId.equals(student._id),
      );
  
    if (studentAlreadyAdded) {
      throw new AppError(
        409,
        "O aluno já está associado a esta turma.",
        "STUDENT_ALREADY_IN_CLASSROOM",
      );
    }
  
    await ClassroomModel.updateOne(
      {
        _id: classroom._id,
      },
      {
        $addToSet: {
          studentIds: student._id,
        },
      },
    );
  
    return getTeacherClassroomById(
      classroomId,
      teacherId,
    );
  }
  
  export async function removeStudentFromClassroom(
    classroomId: string,
    studentId: string,
    teacherId: string,
  ): Promise<PublicClassroomDetails> {
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
  
    const studentIsInClassroom =
      classroom.studentIds.some((currentStudentId) =>
        currentStudentId.equals(studentId),
      );
  
    if (!studentIsInClassroom) {
      throw new AppError(
        404,
        "O aluno não está associado a esta turma.",
        "STUDENT_NOT_IN_CLASSROOM",
      );
    }
  
    await ClassroomModel.updateOne(
      {
        _id: classroom._id,
      },
      {
        $pull: {
          studentIds: studentId,
        },
      },
    );
  
    return getTeacherClassroomById(
      classroomId,
      teacherId,
    );
  }

  export async function updateClassroomStatus(
    classroomId: string,
    teacherId: string,
    active: boolean,
  ): Promise<PublicClassroomDetails> {
    const classroom =
      await ClassroomModel.findOne({
        _id: classroomId,
        teacherId,
      });
  
    if (!classroom) {
      throw new AppError(
        404,
        "Turma não encontrada.",
        "CLASSROOM_NOT_FOUND",
      );
    }
  
    classroom.active = active;
  
    await classroom.save();
  
    return getTeacherClassroomById(
      classroomId,
      teacherId,
    );
  }