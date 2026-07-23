import type {
    NextFunction,
    Request,
    Response,
  } from "express";
  
  import { AppError } from "../errors/app-error";
  import {
    createSkillSchema,
    listSkillsQuerySchema,
    skillIdParamsSchema,
  } from "../schemas/skill.schema";
  import {
    createSkill,
    getTeacherSkillById,
    listTeacherSkills,
  } from "../services/skill.service";
  
  function getAuthenticatedTeacherId(
    request: Request,
  ): string {
    const teacherId = request.auth?.userId;
  
    if (!teacherId) {
      throw new AppError(
        401,
        "Usuário não autenticado.",
        "UNAUTHENTICATED",
      );
    }
  
    return teacherId;
  }
  
  export async function createSkillController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const input = createSkillSchema.parse(
        request.body,
      );
  
      const skill = await createSkill(
        input,
        teacherId,
      );
  
      response.status(201).json({
        message: "Habilidade cadastrada com sucesso.",
        skill,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function listSkillsController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const { subject } =
        listSkillsQuerySchema.parse(
          request.query,
        );
  
      const skills = await listTeacherSkills(
        teacherId,
        subject,
      );
  
      response.status(200).json({
        skills,
        total: skills.length,
      });
    } catch (error) {
      next(error);
    }
  }
  
  export async function getSkillController(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const teacherId =
        getAuthenticatedTeacherId(request);
  
      const { skillId } =
        skillIdParamsSchema.parse(
          request.params,
        );
  
      const skill = await getTeacherSkillById(
        skillId,
        teacherId,
      );
  
      response.status(200).json({
        skill,
      });
    } catch (error) {
      next(error);
    }
  }