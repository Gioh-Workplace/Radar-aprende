import { Router } from "express";

import {
  addQuestionController,
  createAssessmentController,
  getAssessmentController,
  listAssessmentsController,
  removeQuestionController,
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

assessmentRouter.get(
  "/:assessmentId",
  getAssessmentController,
);

assessmentRouter.post(
  "/:assessmentId/questions",
  addQuestionController,
);

assessmentRouter.delete(
  "/:assessmentId/questions/:questionId",
  removeQuestionController,
);