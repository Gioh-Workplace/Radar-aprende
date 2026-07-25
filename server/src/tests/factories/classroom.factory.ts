import { Types } from "mongoose";

import { ClassroomModel } from "../../models/classroom.model";

type ObjectIdLike =
  | Types.ObjectId
  | string;

interface ClassroomFactoryOptions {
  teacherId: ObjectIdLike;
  name?: string;
  subject?: string;
  schoolYear?: string;
  studentIds?: ObjectIdLike[];
  active?: boolean;
}

function toObjectId(
  value: ObjectIdLike,
): Types.ObjectId {
  return new Types.ObjectId(
    String(value),
  );
}

export async function createClassroomFactory(
  options: ClassroomFactoryOptions,
) {
  return ClassroomModel.create({
    name:
      options.name ??
      "7º Ano A",

    subject:
      options.subject ??
      "Matemática",

    schoolYear:
      options.schoolYear ??
      "2026",

    teacherId: toObjectId(
      options.teacherId,
    ),

    studentIds:
      (options.studentIds ?? []).map(
        toObjectId,
      ),

    active:
      options.active ?? true,
  });
}