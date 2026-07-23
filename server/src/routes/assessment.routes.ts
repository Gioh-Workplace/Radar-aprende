import { Router } from "express";

import {
  createAssessmentController,
  listAssessmentsController,
} from "../controllers/assessment.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";

export const assessmentRouter = Router();

assessmentRouter.use(
  ensureAuthenticated,
  ensureRole("TEACHER"),
);

assessmentRouter.post(
  "/",
  createAssessmentController,
);

assessmentRouter.get(
  "/",
  listAssessmentsController,
);
