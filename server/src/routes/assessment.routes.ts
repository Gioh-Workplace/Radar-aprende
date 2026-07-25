import { Router } from "express";

import {
  addQuestionController,
  createAssessmentController,
  getAssessmentController,
  listAssessmentsController,
  publishAssessmentController,
  removeQuestionController,
} from "../controllers/assessment.controller";
import { ensureAuthenticated } from "../middlewares/auth.middleware";
import { ensureRole } from "../middlewares/role.middleware";
import { getAssessmentResultsController } from "../controllers/assessment-result.controller";


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

assessmentRouter.post(
  "/:assessmentId/publish",
  publishAssessmentController,
);

assessmentRouter.get(
  "/:assessmentId/results",
  getAssessmentResultsController,
);