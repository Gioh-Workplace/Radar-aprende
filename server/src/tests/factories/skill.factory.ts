import { Types } from "mongoose";

import { SkillModel } from "../../models/skill.model";

type ObjectIdLike =
  | Types.ObjectId
  | string;

interface SkillFactoryOptions {
  teacherId: ObjectIdLike;
  name?: string;
  description?: string;
  subject?: string;
  active?: boolean;
}

export async function createSkillFactory(
  options: SkillFactoryOptions,
) {
  return SkillModel.create({
    name:
      options.name ??
      "Adição de frações",

    description:
      options.description ??
      "Resolver operações de adição envolvendo frações.",

    subject:
      options.subject ??
      "Matemática",

    teacherId:
      new Types.ObjectId(
        String(options.teacherId),
      ),

    active:
      options.active ?? true,
  });
}
