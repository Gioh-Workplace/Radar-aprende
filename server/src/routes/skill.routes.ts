import { Router } from "express";

import {
  createSkillController,
  getSkillController,
  listSkillsController,
} from "../controllers/skill.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";

export const skillRouter = Router();

skillRouter.use(
  ensureAuthenticated,
  ensureRole("TEACHER"),
);

skillRouter.post(
  "/",
  createSkillController,
);

skillRouter.get(
  "/",
  listSkillsController,
);

skillRouter.get(
  "/:skillId",
  getSkillController,
);