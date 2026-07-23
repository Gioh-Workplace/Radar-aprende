import { AppError } from "../errors/app-error";
import { SkillModel } from "../models/skill.model";
import type { CreateSkillInput } from "../schemas/skill.schema";

export interface PublicSkill {
  id: string;
  name: string;
  description: string | null;
  subject: string;
  teacherId: string;
  active: boolean;
  createdAt: Date;
}

function mapSkill(skill: {
  _id: unknown;
  name: string;
  description?: string | null;
  subject: string;
  teacherId: unknown;
  active: boolean;
  createdAt: Date;
}): PublicSkill {
  return {
    id: String(skill._id),
    name: skill.name,
    description: skill.description ?? null,
    subject: skill.subject,
    teacherId: String(skill.teacherId),
    active: skill.active,
    createdAt: skill.createdAt,
  };
}

export async function createSkill(
  input: CreateSkillInput,
  teacherId: string,
): Promise<PublicSkill> {
  const name = input.name.trim();
  const subject = input.subject.trim();

  const duplicateSkill = await SkillModel.findOne({
    teacherId,
    active: true,
    name: {
      $regex: `^${escapeRegExp(name)}$`,
      $options: "i",
    },
    subject: {
      $regex: `^${escapeRegExp(subject)}$`,
      $options: "i",
    },
  });

  if (duplicateSkill) {
    throw new AppError(
      409,
      "Já existe uma habilidade com este nome para a disciplina informada.",
      "SKILL_ALREADY_EXISTS",
    );
  }

  const skill = await SkillModel.create({
    name,
    description:
      input.description?.trim() || undefined,
    subject,
    teacherId,
    active: true,
  });

  return mapSkill(skill);
}

export async function listTeacherSkills(
  teacherId: string,
  subject?: string,
): Promise<PublicSkill[]> {
  const filter: Record<string, unknown> = {
    teacherId,
    active: true,
  };

  if (subject) {
    filter.subject = {
      $regex: `^${escapeRegExp(subject.trim())}$`,
      $options: "i",
    };
  }

  const skills = await SkillModel.find(filter).sort({
    subject: 1,
    name: 1,
  });

  return skills.map(mapSkill);
}

export async function getTeacherSkillById(
  skillId: string,
  teacherId: string,
): Promise<PublicSkill> {
  const skill = await SkillModel.findOne({
    _id: skillId,
    teacherId,
    active: true,
  });

  if (!skill) {
    throw new AppError(
      404,
      "Habilidade não encontrada.",
      "SKILL_NOT_FOUND",
    );
  }

  return mapSkill(skill);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}